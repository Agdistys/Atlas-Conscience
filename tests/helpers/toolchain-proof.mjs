// Synthetic gate evidence only; these versions never describe an actual browser run.
export function passingToolchain(commit=process.env.INSPECTION_COMMIT||process.env.GITHUB_SHA||null) {
 return {schemaVersion:1,state:'passed',commit,errors:[],node:'0.0.0',platform:'test-fixture',lockSha256:'0'.repeat(64),dependencies:Object.fromEntries(['@playwright/test','playwright','playwright-core','axe-core','leaflet'].map(name=>[name,'0.0.0'])),browser:{engine:'chromium',channel:'bundled',version:'0.0.0'}};
}
