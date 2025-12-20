try:
    from backend import main
    print("Syntax check passed")
except Exception as e:
    print(f"Syntax error: {e}")
