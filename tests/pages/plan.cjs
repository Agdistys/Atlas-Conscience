const fs = require('node:fs');

async function planPages({ github, context }) {
  const repo = context.repo;
  const fullName = `${repo.owner}/${repo.repo}`;
  const branch = await github.rest.repos.getBranch({ ...repo, branch: 'main' });
  const main = branch.data.commit.sha;
  const runs = await github.rest.actions.listWorkflowRuns({ ...repo, workflow_id: 'apps-ci.yml', branch: 'main', event: 'push', head_sha: main, per_page: 10 });
  if (!runs.data.workflow_runs.some(run => run.head_sha === main && run.conclusion === 'success')) {
    return { publish: false, reason: 'Inspection de main non terminee ou en echec' };
  }
  const plan = { publish: true, main, pr: null, commit: null, runId: null, openPRs: [], cache: false };
  if (context.eventName === 'workflow_run') {
    const run = context.payload.workflow_run;
    if (run.conclusion !== 'success' || run.head_repository?.full_name !== fullName) return { publish: false, reason: 'Execution non eligible' };
    if (run.event === 'pull_request') {
      const number = run.pull_requests?.[0]?.number;
      if (!number) return { publish: false, reason: 'PR absente du run' };
      const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: number });
      if (pr.state !== 'open' || pr.head.repo.full_name !== fullName || pr.base.ref !== 'main' || pr.head.sha !== run.head_sha) {
        return { publish: false, reason: 'PR fermee, externe ou commit obsolete' };
      }
      plan.pr = number; plan.commit = run.head_sha; plan.runId = run.id;
    } else if (run.event !== 'push' || run.head_branch !== 'main' || run.head_sha !== main) {
      return { publish: false, reason: 'Execution obsolete ou hors perimetre' };
    }
  } else if (context.eventName !== 'workflow_dispatch') return { publish: false, reason: 'Evenement non pris en charge' };
  const prs = await github.paginate(github.rest.pulls.list, { ...repo, state: 'open', per_page: 100 });
  plan.openPRs = prs.map(pr => pr.number);
  try { await github.rest.git.getRef({ ...repo, ref: 'heads/gh-pages' }); plan.cache = true; }
  catch (error) { if (error.status !== 404) throw error; }
  return plan;
}

module.exports = async ({ github, context, core }) => {
  const plan = await planPages({ github, context });
  fs.writeFileSync('pages-plan.json', JSON.stringify(plan, null, 2));
  core.setOutput('publish', String(plan.publish));
  if (!plan.publish) { core.notice(plan.reason); return; }
  for (const [name, value] of Object.entries(plan)) core.setOutput(name, String(value ?? ''));
};
module.exports.planPages = planPages;
