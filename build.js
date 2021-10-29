const path = require('path');
const execa = require('execa');
const fs = require('fs-extra');

(async function build() {
  const rootDir = __dirname;
  const devtoolsDir = path.join(rootDir, "devtools-frontend");
  const outputDir = path.join(devtoolsDir, "out", "Default", "gen");
  try {
    console.log(`👷🏽‍♂️ Cleaning output...`)
    await fs.emptyDir('front_end');
    console.log(`👷🏽‍♂️ Calling gclient sync...`)
    await execa('gclient', ['sync'], {cwd: devtoolsDir, stdin: 'inherit', stderr: 'inherit', stdout: 'inherit'});
    console.log(`👷🏽‍♂️ Calling gn gen...`)
    await execa('gn', ['gen', 'out/Default'], {cwd: devtoolsDir, stdin: 'inherit', stderr: 'inherit', stdout: 'inherit'});
    console.log(`👷🏽‍♂️ Calling autoninja...`)
    await execa('autoninja', ['-C', 'out/Default'], {cwd: devtoolsDir, stdin: 'inherit', stderr: 'inherit', stdout: 'inherit'});
    console.log(`👷🏽‍♂️ Copying output...`)
    await fs.copy('devtools-frontend/out/Default/gen/front_end', 'front_end', {
      filter: (src, dest) => {
        const isJunk = src.endsWith(".map") || src.endsWith(".ts")
        const isNonEngishLocale = src.includes('/locales/') && !src.endsWith('en-US.json');
        return !(isJunk || isNonEngishLocale);
      }
    })
  } catch (e) {
    console.error('Copy failed', e);
    process.exit(1);
  }
})();
