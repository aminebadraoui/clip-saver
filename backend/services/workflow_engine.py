"""Workflow execution engine."""
import json
import time
import asyncio
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import networkx as nx
from sqlmodel import Session
from services.replicate_service import ReplicateService
from services.credit_service import CreditService
import uuid


@dataclass
class WorkflowNode:
    """Represents a node in the workflow."""
    id: str
    type: str  # 'input', 'replicate', 'transform', 'output'
    data: Dict[str, Any]
    inputs: Dict[str, str]  # Maps input name to source node output


@dataclass
class WorkflowEdge:
    """Represents a connection between nodes."""
    source: str
    target: str
    source_handle: str
    target_handle: str


class WorkflowEngine:
    """Engine for executing AI workflows."""
    
    def __init__(self, session: Session):
        self.session = session
        self.replicate_service = ReplicateService()
        self.credit_service = CreditService()
    
    def parse_workflow(self, workflow_data: str) -> tuple[List[WorkflowNode], List[WorkflowEdge]]:
        """Parse workflow JSON into nodes and edges."""
        data = json.loads(workflow_data)
        
        nodes = []
        for node_data in data.get("nodes", []):
            node = WorkflowNode(
                id=node_data["id"],
                type=node_data["type"],
                data=node_data.get("data", {}),
                inputs={}
            )
            nodes.append(node)
        
        edges = []
        for edge_data in data.get("edges", []):
            edge = WorkflowEdge(
                source=edge_data["source"],
                target=edge_data["target"],
                source_handle=edge_data.get("sourceHandle", "output"),
                target_handle=edge_data.get("targetHandle", "input")
            )
            edges.append(edge)
        
        return nodes, edges
    
    def validate_workflow(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]) -> tuple[bool, Optional[str]]:
        """Validate workflow structure."""
        # Build graph
        G = nx.DiGraph()
        
        for node in nodes:
            G.add_node(node.id)
        
        for edge in edges:
            G.add_edge(edge.source, edge.target)
        
        # Check for cycles
        if not nx.is_directed_acyclic_graph(G):
            return False, "Workflow contains cycles"
        
        # Check for orphaned nodes (except input and output)
        for node in nodes:
            if node.type not in ['input', 'output']:
                if G.in_degree(node.id) == 0 and G.out_degree(node.id) == 0:
                    return False, f"Node {node.id} is not connected"
        
        # Check that there's at least one output or generative node
        has_output = any(node.type == 'output' for node in nodes)
        has_gen_node = any(node.type in ['replicate', 'llm_model', 'inpaint', 'remove_bg'] for node in nodes)
        
        if not has_output and not has_gen_node:
            return False, "Workflow must have at least one output node or AI model node"
        
        return True, None
    
    def get_execution_generations(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge], target_node_ids: Optional[List[str]] = None) -> List[List[str]]:
        """Get topologically sorted generations of nodes for parallel execution."""
        G = nx.DiGraph()
        
        for node in nodes:
            G.add_node(node.id)
        
        for edge in edges:
            G.add_edge(edge.source, edge.target)
        
        # Topological generations
        try:
            generations = list(nx.topological_generations(G))
        except nx.NetworkXError:
            raise ValueError("Cannot determine execution order - workflow may contain cycles")
            
        if not target_node_ids:
            return generations
            
        # Filter layers for target nodes and their dependencies
        nodes_to_keep = set(target_node_ids)
        for node_id in target_node_ids:
            if node_id in G:
                nodes_to_keep.update(nx.ancestors(G, node_id))
        
        filtered_generations = []
        for gen in generations:
            filtered_gen = [n for n in gen if n in nodes_to_keep]
            if filtered_gen:
                filtered_generations.append(filtered_gen)
                
        return filtered_generations

    def calculate_total_cost(self, nodes: List[WorkflowNode], nodes_to_run: Optional[List[str]] = None) -> int:
        """Estimate total credit cost for workflow."""
        total_cost = 0
        
        for node in nodes:
            # If nodes_to_run is specified, only count cost for those nodes
            if nodes_to_run is not None and node.id not in nodes_to_run:
                continue
                
            if node.type == 'replicate':
                model_id = node.data.get('model_id')
                if model_id:
                    cost = self.replicate_service.estimate_cost(self.session, model_id)
                    total_cost += cost
        
        return total_cost
    
    async def execute_node(
        self,
        node: WorkflowNode,
        context: Dict[str, Any],
        edges: List[WorkflowEdge]
    ) -> Any:
        """Execute a single node asynchronously."""
        # Get inputs from context based on edges
        node_inputs = {}
        for edge in edges:
            if edge.target == node.id:
                # IMPORTANT: Since context is shared and updated concurrently by other generations,
                # we must ensure we only access keys that are already present (from previous generations).
                # Current generation nodes don't depend on each other, so this is safe.
                source_output = context.get(edge.source)
                if source_output is not None:
                    node_inputs[edge.target_handle] = source_output
        
        # Execute based on node type
        if node.type in ['input', 'media_input']:
            return node.data.get('value')
        
        elif node.type == 'utility':
            op_type = node.data.get('op_type')
            
            if op_type == 'concat':
                separator = node.data.get('separator', ' ')
                parts = []
                input_keys = sorted([k for k in node_inputs.keys()])
                for k in input_keys:
                    val = node_inputs[k]
                    if val is not None:
                        parts.append(str(val))
                return separator.join(parts)
            return None
        
        elif node.type in ['replicate', 'inpaint', 'remove_bg', 'llm_model']:
            # Run Replicate model
            model_id = node.data.get('model_id')
            if not model_id:
                raise ValueError(f"Node {node.id}: model_id is required")
            
            # Build inputs for the model
            model_inputs = {}
            for key, value in node.data.get('parameters', {}).items():
                if isinstance(value, str) and value.startswith('$'):
                    ref_node_id = value[1:]
                    model_inputs[key] = context.get(ref_node_id)
                else:
                    model_inputs[key] = value
            
            model_inputs.update(node_inputs)

            if 'image' in model_inputs and 'image_input' not in model_inputs:
                model_inputs['image_input'] = model_inputs['image']

            if 'image_input' in model_inputs:
                img_input = model_inputs['image_input']
                if isinstance(img_input, str) and img_input:
                     model_inputs['image_input'] = [img_input]
                elif img_input is None:
                     model_inputs['image_input'] = []
            
            # Run blocking prediction in thread pool to avoid blocking the loop
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                None, 
                lambda: self.replicate_service.run_prediction(model_id, model_inputs)
            )
            
            if result['status'] == 'failed':
                raise ValueError(f"Replicate prediction failed: {result.get('error')}")
            
            output_data = result['output']
            if isinstance(output_data, list):
                if len(output_data) == 1:
                    return output_data[0]
                if all(isinstance(x, str) for x in output_data):
                    if any(x.strip().startswith('http') for x in output_data):
                         return output_data
                    return "".join(output_data)
            return output_data

        elif node.type == 'mask_editor':
            return node.data.get('mask_output')
        
        elif node.type == 'transform':
            transform_type = node.data.get('transform_type')
            input_data = node_inputs.get('input')
            if transform_type == 'select_first':
                if isinstance(input_data, list) and len(input_data) > 0:
                    return input_data[0]
                return input_data
            return input_data
        
        elif node.type == 'output':
            return node_inputs.get('input')
        
        else:
            raise ValueError(f"Unknown node type: {node.type}")
    
    async def execute(
        self,
        workflow_data: str,
        input_data: Dict[str, Any],
        user_id: uuid.UUID,
        target_node_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Execute the workflow asynchronously, optionally only specific nodes."""
        start_time = time.time()
        
        # Parse workflow
        nodes, edges = self.parse_workflow(workflow_data)
        
        # Validate
        is_valid, error = self.validate_workflow(nodes, edges)
        if not is_valid:
            return {
                "status": "failed",
                "error": error
            }
        
        # Get execution generations (layers of safe-to-parallelize nodes)
        try:
            generations = self.get_execution_generations(nodes, edges, target_node_ids)
        except ValueError as e:
            return {
                "status": "failed",
                "error": str(e)
            }
            
        # Check credits (flatten generations to get all nodes to run)
        all_nodes_to_run = [n_id for gen in generations for n_id in gen]
        estimated_cost = self.calculate_total_cost(nodes, all_nodes_to_run)
        if not self.credit_service.has_sufficient_credits(self.session, user_id, estimated_cost):
            balance = self.credit_service.get_balance(self.session, user_id)
            return {
                "status": "failed",
                "error": f"Insufficient credits. Required: {estimated_cost}, Available: {balance}"
            }
        
        # Create execution context
        context = {}
        
        # Initialize input values
        for node in nodes:
            if node.type == 'input':
                input_name = node.data.get('name', node.id)
                if input_name in input_data:
                    context[node.id] = input_data[input_name]
                else:
                    context[node.id] = node.data.get('default_value')
        
        # Execute generations
        credits_used = 0
        try:
            for generation in generations:
                # Get node objects for this generation
                gen_nodes = [n for n in nodes if n.id in generation]
                
                # Execute all nodes in this generation concurrently
                # We create tasks for each node execution
                tasks = [
                    self.execute_node(node, context, edges)
                    for node in gen_nodes
                ]
                
                if not tasks:
                    continue

                # Wait for all nodes in this layer to complete
                results = await asyncio.gather(*tasks)
                
                # Update context with results
                for node, result in zip(gen_nodes, results):
                    context[node.id] = result
                    
                    # Track credits
                    if node.type == 'replicate':
                        model_id = node.data.get('model_id')
                        cost = self.replicate_service.estimate_cost(self.session, model_id)
                        credits_used += cost
            
            # Collect outputs
            outputs = {}
            if target_node_ids:
                for node_id in target_node_ids:
                    outputs[node_id] = context.get(node_id)
            
            for node in nodes:
                if node.id in context:
                    if node.type == 'output':
                        output_name = node.data.get('name', node.id)
                        outputs[output_name] = context.get(node.id)
                    elif node.type in ['replicate', 'llm_model', 'inpaint', 'remove_bg']:
                        outputs[node.id] = context.get(node.id)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            return {
                "status": "completed",
                "outputs": outputs,
                "credits_used": credits_used,
                "execution_time_ms": execution_time
            }
        
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            return {
                "status": "failed",
                "error": str(e),
                "credits_used": credits_used,
                "execution_time_ms": execution_time
            }
