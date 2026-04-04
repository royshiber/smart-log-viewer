export async function fetchProjectStatus() {
  const response = await fetch('/api/project-status');
  if (!response.ok) {
    throw new Error(`Failed to fetch project status: ${response.status}`);
  }
  return response.json();
}

export async function saveProjectStatus(payload) {
  const response = await fetch('/api/project-status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!response.ok) {
    throw new Error(`Failed to save project status: ${response.status}`);
  }
  return response.json();
}
