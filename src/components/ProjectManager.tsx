import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { createProject, getProject, deployProject } from '../lib/api';
import { Plus, Folder, Settings2, Globe, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import type { DeploymentConfig } from '../lib/types';

interface Project {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  deployment_data?: {
    config?: DeploymentConfig;
    lastDeployment?: string;
  };
}

export function ProjectManager() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [deployingProject, setDeployingProject] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Load user's projects
    const loadProjects = async () => {
      try {
        const { data } = await getProject(user.id);
        if (data) setProjects(data);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [user]);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const project = await createProject(newProjectName, newProjectDesc);
      setProjects([...projects, project]);
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  }

  async function handleDeploy(projectId: string) {
    try {
      setDeployingProject(projectId);
      const config: DeploymentConfig = {
        provider: 'netlify',
        buildCommand: 'npm run build',
        outputDir: 'dist',
        framework: 'react',
        nodeVersion: '18.x'
      };

      const deployment = await deployProject(projectId, config);
      
      // Update project in state with new deployment data
      setProjects(projects.map(p => 
        p.id === projectId 
          ? { 
              ...p, 
              deployment_data: {
                ...p.deployment_data,
                lastDeployment: new Date().toISOString(),
                url: deployment.url
              }
            }
          : p
      ));
    } catch (error) {
      console.error('Failed to deploy project:', error);
    } finally {
      setDeployingProject(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="h-24 bg-gray-800 rounded"></div>
          <div className="h-24 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {showNewProject && (
        <form onSubmit={handleCreateProject} className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter project name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewProject(false)}
              className="px-3 py-1.5 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Project
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-blue-400" />
                <h3 className="font-medium">{project.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDeploy(project.id)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    deployingProject === project.id
                      ? "bg-blue-500/20 text-blue-400 cursor-wait"
                      : "hover:bg-gray-700"
                  )}
                  disabled={deployingProject === project.id}
                >
                  <Upload className="h-4 w-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {project.description && (
              <p className="mt-2 text-sm text-gray-400">{project.description}</p>
            )}

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                project.is_public ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              )}>
                <Globe className="h-3 w-3" />
                {project.is_public ? 'Public' : 'Private'}
              </span>

              {project.deployment_data?.lastDeployment && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                  <Upload className="h-3 w-3" />
                  Last deployed {new Date(project.deployment_data.lastDeployment).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}