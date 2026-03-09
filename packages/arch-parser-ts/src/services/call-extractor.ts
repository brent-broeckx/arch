import {
  Node,
  SyntaxKind,
  type CallExpression,
  type Expression,
  type SourceFile,
} from 'ts-morph'
import type { ParseState } from '../models/parser-types'
import { getLoc } from '../utils/loc-utils'
import { toRelativePath } from '../utils/path-utils'
import { addEdge } from './parse-state'

export function extractCallEdges(sourceFile: SourceFile, state: ParseState): void {
  const filePath = toRelativePath(sourceFile.getFilePath(), state.rootDir)
  const callableNameToNodeIds = createCallableNameIndex(state)

  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpression) => {
    const callerNodeId = resolveCallerNodeId(callExpression, filePath)
    if (!callerNodeId) {
      return
    }

    const targetNodeIds = resolveTargetNodeIds(callExpression, state, callableNameToNodeIds)
    if (targetNodeIds.length === 0) {
      return
    }

    targetNodeIds.forEach((targetNodeId) => {
      addEdge(state, {
        from: callerNodeId,
        to: targetNodeId,
        type: 'calls',
        filePath,
        loc: getLoc(callExpression),
      })
    })
  })
}

function resolveTargetNodeIds(
  callExpression: CallExpression,
  state: ParseState,
  callableNameToNodeIds: Map<string, string[]>,
): string[] {
  const resolvedBySymbol = resolveTargetNodeIdsFromSymbol(callExpression, state)
  if (resolvedBySymbol.length > 0) {
    return resolvedBySymbol
  }

  const calleeName = resolveCalleeName(callExpression)
  if (!calleeName) {
    return []
  }

  return callableNameToNodeIds.get(calleeName) ?? []
}

function createCallableNameIndex(state: ParseState): Map<string, string[]> {
  const nameToIds = new Map<string, string[]>()

  state.nodes
    .filter((node) => node.type === 'function' || node.type === 'method')
    .forEach((node) => {
      const existing = nameToIds.get(node.name)
      if (existing) {
        existing.push(node.id)
      } else {
        nameToIds.set(node.name, [node.id])
      }
    })

  return new Map(
    [...nameToIds.entries()].map(([name, ids]) => [
      name,
      [...ids].sort((left, right) => left.localeCompare(right)),
    ]),
  )
}

function resolveCallerNodeId(callExpression: CallExpression, filePath: string): string | undefined {
  const ancestors = callExpression.getAncestors()

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index]

    if (ancestor.getKind() === SyntaxKind.MethodDeclaration) {
      const methodDeclaration = ancestor.asKind(SyntaxKind.MethodDeclaration)
      const methodName = methodDeclaration?.getName()
      const classDeclaration = methodDeclaration?.getFirstAncestorByKind(
        SyntaxKind.ClassDeclaration,
      )
      const className = classDeclaration?.getName()

      if (methodName && className) {
        return `method:${filePath}#${className}.${methodName}`
      }

      return undefined
    }

    if (ancestor.getKind() === SyntaxKind.FunctionDeclaration) {
      const functionDeclaration = ancestor.asKind(SyntaxKind.FunctionDeclaration)
      const functionName = functionDeclaration?.getName()

      if (functionName) {
        return `function:${filePath}#${functionName}`
      }

      return undefined
    }
  }

  return undefined
}

function resolveTargetNodeIdsFromSymbol(
  callExpression: CallExpression,
  state: ParseState,
): string[] {
  const expression = callExpression.getExpression()
  const candidateSymbols = [expression.getSymbol()]

  if (Node.isPropertyAccessExpression(expression)) {
    candidateSymbols.push(expression.getNameNode().getSymbol())
  }

  const resolvedNodeIds = new Set<string>()

  candidateSymbols
    .filter((symbol): symbol is NonNullable<typeof symbol> => symbol !== undefined)
    .forEach((symbol) => {
      const directDeclarations = symbol.getDeclarations()
      directDeclarations.forEach((declaration) => {
        const nodeId = toNodeIdFromDeclaration(declaration, state.rootDir)
        if (nodeId && state.nodeIds.has(nodeId)) {
          resolvedNodeIds.add(nodeId)
        }
      })

      const aliasedSymbol = symbol.getAliasedSymbol()
      aliasedSymbol
        ?.getDeclarations()
        .forEach((declaration) => {
          const nodeId = toNodeIdFromDeclaration(declaration, state.rootDir)
          if (nodeId && state.nodeIds.has(nodeId)) {
            resolvedNodeIds.add(nodeId)
          }
        })
    })

  return [...resolvedNodeIds].sort((left, right) => left.localeCompare(right))
}

function toNodeIdFromDeclaration(declaration: Node, rootDir: string): string | undefined {
  const filePath = toRelativePath(declaration.getSourceFile().getFilePath(), rootDir)

  if (Node.isFunctionDeclaration(declaration)) {
    const functionName = declaration.getName()
    if (!functionName) {
      return undefined
    }

    return `function:${filePath}#${functionName}`
  }

  if (Node.isMethodDeclaration(declaration)) {
    const methodName = declaration.getName()
    const classDeclaration = declaration.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)
    const className = classDeclaration?.getName()

    if (!methodName || !className) {
      return undefined
    }

    return `method:${filePath}#${className}.${methodName}`
  }

  return undefined
}

function resolveCalleeName(callExpression: CallExpression): string | undefined {
  const expression = callExpression.getExpression()
  if (Node.isIdentifier(expression)) {
    return expression.getText()
  }

  if (Node.isPropertyAccessExpression(expression)) {
    const methodName = expression.getName()
    const receiver = expression.getExpression()

    if (receiver.getKind() === SyntaxKind.ThisKeyword) {
      const classDeclaration = callExpression.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)
      const className = classDeclaration?.getName()
      if (className) {
        return `${className}.${methodName}`
      }
      return undefined
    }

    if (Node.isIdentifier(receiver)) {
      const inferredClassName = inferClassNameFromIdentifier(receiver)
      if (inferredClassName) {
        return `${inferredClassName}.${methodName}`
      }

      return `${receiver.getText()}.${methodName}`
    }

    const inferredReceiverClassName = inferClassNameFromExpression(receiver)
    if (inferredReceiverClassName) {
      return `${inferredReceiverClassName}.${methodName}`
    }

    return expression.getText()
  }

  return undefined
}

function inferClassNameFromIdentifier(identifier: Node): string | undefined {
  if (!Node.isIdentifier(identifier)) {
    return undefined
  }

  const symbol = identifier.getSymbol()
  if (!symbol) {
    return undefined
  }

  for (const declaration of symbol.getDeclarations()) {
    if (!Node.isVariableDeclaration(declaration)) {
      continue
    }

    const initializer = declaration.getInitializer()
    if (!initializer || !Node.isNewExpression(initializer)) {
      continue
    }

    const classExpression = initializer.getExpression()
    if (!Node.isIdentifier(classExpression)) {
      continue
    }

    return classExpression.getText()
  }

  return undefined
}

function inferClassNameFromExpression(expression: Expression): string | undefined {
  if (Node.isPropertyAccessExpression(expression)) {
    const nestedInferredClassName = inferClassNameFromExpression(expression.getExpression())
    if (nestedInferredClassName) {
      return nestedInferredClassName
    }
  }

  const typeSymbol = expression.getType().getSymbol() ?? expression.getType().getAliasSymbol()
  if (!typeSymbol) {
    return undefined
  }

  const symbolName = typeSymbol.getName()
  if (!symbolName || symbolName === '__type') {
    return undefined
  }

  return symbolName
}
