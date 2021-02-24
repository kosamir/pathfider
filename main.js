var { PathFinder } = require('./PathFinder');
/**
 * main program for path finding
 */
async function main() {
  var pathWalker = new PathFinder();
  await pathWalker.readFiles();
  pathWalker.findStartPosition();
  try {
    pathWalker.walk();
    pathWalker.printPathResults();
  } catch (error) {
    console.log({ error });
    console.log('Error  :' + error);
  }
}
main();
