import type { ArchEdge, ArchNode, GraphData } from '@arch/core'

export class ArchitectureGraph {
  private readonly nodeMap = new Map<string, ArchNode>()
  private readonly edgeList: ArchEdge[] = []

  public addNode(node: ArchNode): void {
    this.nodeMap.set(node.id, node)
  }

  public addEdge(edge: ArchEdge): void {
    this.edgeList.push(edge)
  }

  public getNode(nodeId: string): ArchNode | undefined {
    return this.nodeMap.get(nodeId)
  }

  public getNodes(): ArchNode[] {
    return [...this.nodeMap.values()]
  }

  public getEdges(): ArchEdge[] {
    return [...this.edgeList]
  }

  public getOutgoingEdges(nodeId: string): ArchEdge[] {
    return this.edgeList.filter((edge) => edge.from === nodeId)
  }

  public toGraphData(): GraphData {
    return {
      nodes: this.getNodes(),
      edges: this.getEdges(),
    }
  }
}
