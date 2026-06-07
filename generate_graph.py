import argparse
import csv
import random

def generate_vertex_name(index):
    """Generates Excel-style column names: A, B, C... Z, AA, AB..."""
    name = ""
    while index >= 0:
        name = chr(index % 26 + 65) + name
        index = index // 26 - 1
    return name

def main():
    parser = argparse.ArgumentParser(description="Generate a random weighted graph in CSV format.")
    parser.add_argument("-v", "--vertices", type=int, default=10, help="Number of vertices (default: 10)")
    parser.add_argument("-e", "--edges", type=int, default=15, help="Number of edges (default: 15)")
    parser.add_argument("-o", "--output", type=str, default="generated_graph.csv", help="Output CSV filename")
    parser.add_argument("--min-weight", type=float, default=1.0, help="Minimum weight for vertices and edges")
    parser.add_argument("--max-weight", type=float, default=10.0, help="Maximum weight for vertices and edges")

    args = parser.parse_args()

    max_edges = args.vertices * (args.vertices - 1) // 2
    if args.edges > max_edges:
        print(f"Warning: Number of edges ({args.edges}) is greater than maximum possible edges for a simple graph with {args.vertices} vertices. Capping at {max_edges}.")
        args.edges = max_edges

    # Generate vertices and their weights
    vertices = [generate_vertex_name(i) for i in range(args.vertices)]
    vertex_weights = {v: round(random.uniform(args.min_weight, args.max_weight), 2) for v in vertices}

    # Generate random edges
    possible_edges = [(u, v) for i, u in enumerate(vertices) for v in vertices[i+1:]]
    selected_edges = random.sample(possible_edges, args.edges)

    # Write to CSV
    with open(args.output, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["source", "target", "edge_weight", "source_weight", "target_weight"])

        for u, v in selected_edges:
            edge_weight = round(random.uniform(args.min_weight, args.max_weight), 2)
            writer.writerow([u, v, edge_weight, vertex_weights[u], vertex_weights[v]])
            
    print(f"✅ Generated random graph with {args.vertices} vertices and {args.edges} edges.")
    print(f"📁 Saved to: {args.output}")

if __name__ == "__main__":
    main()
