const fs = require('fs')
const path = require('path')

const rootDir = process.cwd()

copyPackageProps('../package.json', '../dist/package.json')

function copyPackageProps(fromPackPath, toPackPath) {
  const rootPack = require(fromPackPath)
  const toPackage = require.resolve(toPackPath)
  const pack = require(toPackage)

  const keys = [
    'version','keywords','description','name',
    'author','repository','license','contributors',
    'jsDependencies'//old
  ]

  keys.forEach(name=>{
    if( rootPack[name]==null )return
    pack[name] = rootPack[name]
  })

  delete pack.private;

  fs.writeFileSync(toPackage, JSON.stringify(pack, null, 2))
  
  console.log('\x1b[33m[angular-file]:\x1b[0m', 'updated dist package version to ', pack.version)
}

distCopy('CHANGELOG.md')
distCopy('README.md')
distCopy('LICENSE')

function distCopy(fileName){
  const fromReadMe = path.join(rootDir, fileName)
  const toReadMe = path.join(rootDir , 'dist', fileName)
  fs.writeFileSync(toReadMe, fs.readFileSync(fromReadMe))
}
