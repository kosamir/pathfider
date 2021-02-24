var assert = require('assert');
var { Position, PathFinder } = require('../PathFinder');
var path = new PathFinder();
/**
 * test suite for pathfinder class
 */
describe('Pathfinder - test suite', async function () {
  describe('visited position test', function () {
    it('test visited positions', function () {
      let visitedPositions = [new Position(0, 0), new Position(0, 1)];
      let visitedPos = path.isPositionVisited(
        visitedPositions,
        new Position(0, 0),
      );
      let unvisitedPos = path.isPositionVisited(
        visitedPositions,
        new Position(1, 3),
      );
      assert(visitedPos === true, 'test visited postion failed');
      assert(unvisitedPos === false, 'test unvisited postion failed');
      visitedPos = [];
      assert(
        path.isPositionVisited(visitedPos, new Position(0, 0)) === false,
        ' test empty visited postions FAILED',
      );
    });
  });
  describe('path validator', function () {
    it('testing path validator', () => {
      assert(path.pathTester.test('|'), 'Horizotal path test failed');
      assert(path.pathTester.test('-'), 'Vertical path test failed');
      assert(path.pathTester.test('+'), 'Interseciton path test failed');
      assert(
        path.pathTester.test('?') === false,
        'Invalid character test failed',
      );
    });
  });
  describe('test reading input files', function () {
    it('ten files read from resources directory', async function () {
      await path.readFiles();
      assert(path.filematrix.length === 10, 'Error not all files are read');
      path.filematrix.forEach(el => {
        assert(el !== null, 'all files sucessfuly read!');
        assert(
          path.fileContent.get(el) !== null,
          ' file content initialization error',
        );
        assert(
          path.matrix.get(el) !== null,
          'file matrix initialization error',
        );
      });
    });
  });
  describe('read all input files and test output', () => {
    it('test all files output', async () => {
      await path.readFiles();
      path.findStartPosition();
      path.walk();
      var test1 = path.results.get('test1');
      assert(
        test1.letters.join('') === 'ACB',
        'file:test1  letters test FAILED',
      );
      assert(
        test1.path.join('').toString() === '@---A---+|C|+---+|+-B-x',
        ' file:test1  path test FAILED',
      );
      assert(test1.errors.length === 0, 'file:test1 no errors test FAILED');

      var test2 = path.results.get('test2');
      assert(
        test2.letters.join('') === 'ABCD',
        'file:test2  letters test FAILED',
      );
      assert(
        test2.path.join('').toString() === '@|A+---B--+|+--C-+|-||+---D--+|x',
        ' file:test2 path test FAILED',
      );
      assert(test2.errors.length === 0, 'file:test2 no errors test FAILED');

      var test3 = path.results.get('test3');
      assert(
        test3.letters.join('') === 'ACB',
        'file: test3 letters test FAILED',
      );
      assert(
        test3.path.join('').toString() === '@---A---+|||C---+|+-B-x',
        'file:test3  path test failed',
      );
      assert(test3.errors.length === 0, 'file:test3  no errors test FAILED');

      var test4 = path.results.get('test4');
      assert(
        test4.letters.join('') === 'ABCD',
        'file:test4  letters test FAILED',
      );
      assert(
        test4.path.join('').toString() ===
          '@--A-+|+-+|A|+--B--+C|+-+|+-C-+|D|x',
        'file: test4 path test FAILED',
      );
      assert(test4.errors.length === 0, 'file:test4  no errors test FAILED');

      var test5 = path.results.get('test5');
      assert(
        test5.letters.join('') === 'ABCD',
        'file:test4  letters test FAILED',
      );
      assert(
        test5.path.join('').toString() === '@A+++A|+-B-+C+++C-+Dx',
        'file:test5  path test FAILED',
      );
      assert(test5.errors.length === 0, 'file:test5  no errors test FAILED');

      var err_multi_end = path.results.get('err-multi-end');
      assert(
        err_multi_end.errors.length > 0,
        'multi end has errors TEST failed',
      );
      var err_multi_start = path.results.get('err-multi-start');
      assert(
        err_multi_start.errors.length > 0,
        'multi start has errors TEST failed',
      );
      var err_no_end = path.results.get('err-no-end');
      assert(err_no_end.errors.length > 0, 'err-no-end has errors TEST failed');
      var err_no_start = path.results.get('err-no-start');
      assert(
        err_no_start.errors.length > 0,
        'err-no-start has errors TEST failed',
      );
      var err_t_fork = path.results.get('err-t-fork');
      assert(err_t_fork.errors.length > 0, 'err_t_fork has errors TEST FAILED');
    });
  });
});
