'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProjectsService } from '@/lib/services/projects.service';

export default function ProjectsCatalog() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await ProjectsService.findAll({ limit: 50 });
        // Depending on backend pagination, data might be an array or { data: [] }
        setProjects(data.data || data);
      } catch (err) {
        setError('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 border-b border-slate-200 pb-5 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-slate-900">Find Work</h1>
          <p className="mt-2 text-sm text-slate-500">
            Browse the latest freelance opportunities powered by our AI matching engine.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-xl border border-slate-200 h-32"></div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">No projects found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {project.title}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 whitespace-nowrap ml-3">
                    ${project.budget}
                  </span>
                </div>
                <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.skillsRequired?.slice(0, 3).map((skill: string) => (
                    <span key={skill} className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {skill}
                    </span>
                  ))}
                  {project.skillsRequired?.length > 3 && (
                    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      +{project.skillsRequired.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
