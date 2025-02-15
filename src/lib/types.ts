import { z } from 'zod';

export const ModelType = z.enum(['GPT4', 'CLAUDE', 'CODEQWEN']);
export type ModelType = z.infer<typeof ModelType>;

export const CodeGenRequest = z.object({
  prompt: z.string(),
  model: ModelType,
  maxTokens: z.number().default(8000),
  temperature: z.number().min(0).max(1).default(0.7),
  context: z.object({
    files: z.array(z.object({
      path: z.string(),
      content: z.string()
    })),
    language: z.string().optional(),
    framework: z.string().optional()
  }).optional()
});

export type CodeGenRequest = z.infer<typeof CodeGenRequest>;

export const CodeGenResponse = z.object({
  code: z.string(),
  explanation: z.string().optional(),
  tests: z.string().optional(),
  model: ModelType,
  attribution: z.array(z.string()).optional(),
  performance: z.object({
    latency: z.number(),
    tokens: z.number()
  })
});

export type CodeGenResponse = z.infer<typeof CodeGenResponse>;

export const RAGQuery = z.object({
  query: z.string(),
  context: z.array(z.object({
    title: z.string(),
    content: z.string(),
    similarity: z.number()
  }))
});

export type RAGQuery = z.infer<typeof RAGQuery>;

export const DeploymentConfig = z.object({
  provider: z.enum(['netlify', 'vercel', 'cloudflare']),
  buildCommand: z.string(),
  outputDir: z.string(),
  environmentVariables: z.record(z.string()).optional(),
  framework: z.enum(['react', 'vue', 'svelte', 'astro']).optional(),
  nodeVersion: z.string().optional()
});

export type DeploymentConfig = z.infer<typeof DeploymentConfig>;

export const CollaborationSession = z.object({
  id: z.string(),
  projectId: z.string(),
  participants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.enum(['owner', 'editor', 'viewer']),
    cursor: z.object({
      line: z.number(),
      column: z.number()
    }).optional()
  })),
  activeFile: z.string().optional(),
  chat: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    content: z.string(),
    timestamp: z.string()
  })).optional()
});

export type CollaborationSession = z.infer<typeof CollaborationSession>;