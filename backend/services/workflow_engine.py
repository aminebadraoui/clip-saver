"""Workflow execution engine."""
import json
import time
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
        
        # Check that there's at least one input and one output
        has_input = any(node.type == 'input' for node in nodes)
        has_output = any(node.type == 'output' for node in nodes)
        
        if not has_input:
            return False, "Workflow must have at least one input node"
        if not has_output:
            return False, "Workflow must have at least one output node"
        
        return True, None
    
    def get_execution_order(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]) -> List[str]:
        """Get topologically sorted execution order."""
        G = nx.DiGraph()
        
        for node in nodes:
            G.add_node(node.id)
        
        for edge in edges:
            G.add_edge(edge.source, edge.target)
        
        # Topological sort
        try:
            return list(nx.topological_sort(G))
        except nx.NetworkXError:
            raise ValueError("Cannot determine execution order - workflow may contain cycles")
    
    def calculate_total_cost(self, nodes: List[WorkflowNode]) -> int:
        """Estimate total credit cost for workflow."""
        total_cost = 0
        
        for node in nodes:
            if node.type == 'replicate':
                model_id = node.data.get('model_id')
                if model_id:
                    cost = self.replicate_service.estimate_cost(self.session, model_id)
                    total_cost += cost
        
        return total_cost
    
    def execute_node(
        self,
        node: WorkflowNode,
        context: Dict[str, Any],
        edges: List[WorkflowEdge]
    ) -> Any:
        """Execute a single node."""
        # Get inputs from context based on edges
        node_inputs = {}
        for edge in edges:
            if edge.target == node.id:
                source_output = context.get(edge.source)
                if source_output is not None:
                    node_inputs[edge.target_handle] = source_output
        
        # Execute based on node type
        if node.type == 'input':
            # Input nodes just pass through their data
            return node.data.get('value')
        
        elif node.type == 'replicate':
            # Run Replicate model
            model_id = node.data.get('model_id')
            if not model_id:
                raise ValueError(f"Node {node.id}: model_id is required")
            
            # Build inputs for the model
            model_inputs = {}
            for key, value in node.data.get('parameters', {}).items():
                # Check if value is a reference to another node's output
                if isinstance(value, str) and value.startswith('$'):
                    # Reference to another node
                    ref_node_id = value[1:]
                    model_inputs[key] = context.get(ref_node_id)
                else:
                    model_inputs[key] = value
            
            # Also add direct inputs from edges
            model_inputs.update(node_inputs)
            
            # Run the prediction
            result = self.replicate_service.run_prediction(model_id, model_inputs)
            
            if result['status'] == 'failed':
                raise ValueError(f"Replicate prediction failed: {result.get('error')}")
            
            return result['output']
        
        elif node.type == 'transform':
            # Transform operations (resize, crop, etc.)
            transform_type = node.data.get('transform_type')
            input_data = node_inputs.get('input')
            
            if transform_type == 'select_first':
                # Select first item from array
                if isinstance(input_data, list) and len(input_data) > 0:
                    return input_data[0]
                return input_data
            
            # Add more transform types as needed
            return input_data
        
        elif node.type == 'output':
            # Output nodes collect results
            return node_inputs.get('input')
        
        else:
            raise ValueError(f"Unknown node type: {node.type}")
    
    def execute(
        self,
        workflow_data: str,
        input_data: Dict[str, Any],
        user_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Execute the workflow."""
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
        
        # Check credits
        estimated_cost = self.calculate_total_cost(nodes)
        if not self.credit_service.has_sufficient_credits(self.session, user_id, estimated_cost):
            balance = self.credit_service.get_balance(self.session, user_id)
            return {
                "status": "failed",
                "error": f"Insufficient credits. Required: {estimated_cost}, Available: {balance}"
            }
        
        # Get execution order
        execution_order = self.get_execution_order(nodes, edges)
        
        # Create execution context
        context = {}
        
        # Set input values
        for node in nodes:
            if node.type == 'input':
                input_name = node.data.get('name', node.id)
                if input_name in input_data:
                    context[node.id] = input_data[input_name]
                else:
                    context[node.id] = node.data.get('default_value')
        
        # Execute nodes in order
        credits_used = 0
        try:
            for node_id in execution_order:
                node = next(n for n in nodes if n.id == node_id)
                
                # Execute node
                result = self.execute_node(node, context, edges)
                context[node_id] = result
                
                # Track credits for Replicate nodes
                if node.type == 'replicate':
                    model_id = node.data.get('model_id')
                    cost = self.replicate_service.estimate_cost(self.session, model_id)
                    credits_used += cost
            
            # Collect outputs
            outputs = {}
            for node in nodes:
                if node.type == 'output':
                    output_name = node.data.get('name', node.id)
                    outputs[output_name] = context.get(node.id)
            
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
