import prisma from '@/lib/prisma'
import { CodeArtifact } from './frontend'

export async function persistCodeArtifacts(workspaceId: string, files: CodeArtifact[]) {
  const artifactPromises = files.map((file) => {
    return prisma.artifact.create({
      data: {
        workspaceId,
        artifactType: 'code',
        content: JSON.stringify(file),
        version: 1,
        isApproved: false,
      },
    })
  })

  await Promise.all(artifactPromises)
  
  // TODO: Add logic here to physically write these files to a 'generated_projects/[workspaceId]' directory
  // and initialize a git repository, then push to GitHub via an octokit integration.
  // Example:
  // fs.mkdirSync(\`./generated_projects/\${workspaceId}\`, { recursive: true })
  // fs.writeFileSync(\`./generated_projects/\${workspaceId}/\${file.filePath}\`, file.code)
  
  return true
}
