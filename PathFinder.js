const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

/**
 * constants
 */

const START = '@';
const CROSSROADS = '+';
const HORIZONTAL_PATH = '-';
const VERTICAL_PATH = '|';
const END = 'x';
const DOWN = 'DOWN';
const UP = 'UP';
const LEFT = 'LEFT';
const RIGHT = 'RIGHT';

/**
 * Postion holds the position on board.
 */
class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
/**
 * Result holds the result of the walk
 */
class Result {
  constructor(path, letters, matrix, fileName, hasErrors, errors) {
    this.path = path;
    this.letters = letters;
    this.matrix = matrix;
    this.fileName = fileName;
    this.hasErrors = hasErrors;
    this.errors = errors;
  }
  toString() {
    let isError = this.errors && this.errors.length > 0;
    return `
    fileName:${this.fileName}\n
    letters: ${this.letters.join('')}\n
    path:${this.path.join('').toString()}\n
    errors:${isError ? this.errors : []}
    `;
  }
}

/**
 * PathFinder main class for path finding.
 */
class PathFinder {
  constructor() {
    this.matrix = new Map();
    this.filematrix = [];
    this.fileContent = new Map();
    this.results = new Map();
    this.startPositions = new Map();
    this.pathTester = new RegExp(
      `\\${VERTICAL_PATH}|\\${CROSSROADS}|\\${HORIZONTAL_PATH}|[a-z]`,
      'i',
    );
  }
  initialize(p_string, filename) {
    this.filematrix.push(filename);
    let rows = p_string.split('\n');
    this.matrix.set(
      filename,
      rows.map(el => el.split('')),
    );
    // i.e error checking, multiple start/begining, no start/begining
    this.fileContent.set(filename, p_string);
  }
  async readFiles() {
    let fileList = await readdir(__dirname + '/resources/');
    for (let i = 0; i < fileList.length; ++i) {
      let res = await readFileAsync(
        __dirname + `/resources/${fileList[i]}`,
        'utf8',
      );
      this.initialize(res, fileList[i]);
    }
  }
  /**
   * is input valid i.e ONLY one '@' and ONLY one 'x'
   * @param {*} matrix
   * @param {*} filename
   */
  isMatrixValid(filename) {
    let flatenMatrix = this.fileContent.get(filename);
    let start = flatenMatrix.split(START);
    let errors = [];

    if (start.length > 2) {
      errors.push(`Invalid matrix in file:${filename} double ${START}!!!!`);
    } else if (flatenMatrix.indexOf(START) === -1) {
      errors.push(
        `Invalid matrix file:${filename} no start position ${START} `,
      );
    }
    let end = flatenMatrix.split(END);
    if (end.length > 2) {
      errors.push(`Invalid matrix in file:${filename} double ${END}!! `);
    } else if (flatenMatrix.indexOf(END) === -1) {
      errors.push(`Invalid matrix file:${filename} no end position: ${END}`);
    }
    return errors.length > 0 ? errors : void 0;
  }
  /**
   * print results
   */
  printPathResults() {
    console.log('***RESULTS***');
    this.filematrix.forEach(el => {
      let result = this.results.get(el);
      result && console.log(result.toString());
    });
  }

  /**
   * find start positions in all consumed files
   */
  findStartPosition() {
    this.filematrix.forEach(el => {
      let matrix = this.matrix.get(el);
      for (let i = 0; i < matrix.length; ++i) {
        for (let j = 0; j < matrix[i].length; ++j) {
          if (matrix[i][j] === START) {
            let position = new Position(i, j);
            this.startPositions.set(el, position);
          }
        }
      }
    });
  }
  /**
   * get Char value on board, allowed characters |,-,+,[a-z],
   * catch error when we try to read position outside of board
   * @param {Postion} position
   * @param {*} matrix
   */
  getChar(position, matrix) {
    try {
      let char = matrix[position.x][position.y];
      if (this.pathTester.test(char)) {
        return matrix[position.x][position.y];
      }
      return void 0;
    } catch (error) {
      // out of board
      return void 0;
    }
  }

  /**
   * returns if position has already been visited
   * @param {*} positons
   * @param {*} position
   */
  isPositionVisited(positons, position) {
    let found = positons.filter(
      el => el.x === position.x && el.y === position.y,
    );
    return positons.length > 0 ? found.length === 1 : false;
  }

  /**
   * get all sorounidng position ie UP, DOWN,LEFT, RIGHT only positions
   * with allowed charachters i.e |,-,+,[a-z]
   * @param {*} curPos
   * @param {*} matrix
   */
  filterSouroundingPositions(curPos, matrix) {
    let down = this.getChar(new Position(curPos.x + 1, curPos.y), matrix)
      ? new Position(curPos.x + 1, curPos.y)
      : void 0;
    let up = this.getChar(new Position(curPos.x - 1, curPos.y), matrix)
      ? new Position(curPos.x - 1, curPos.y)
      : void 0;
    let left = this.getChar(new Position(curPos.x, curPos.y - 1), matrix)
      ? new Position(curPos.x, curPos.y - 1)
      : void 0;
    let right = this.getChar(new Position(curPos.x, curPos.y + 1), matrix)
      ? new Position(curPos.x, curPos.y + 1)
      : void 0;
    let map = new Map();
    down && map.set(DOWN, down);
    up && map.set(UP, up);
    left && map.set(LEFT, left);
    right && map.set(RIGHT, right);
    return map;
  }
  /**
   * try to find available positon
   * @param {*} matrix
   * @param {*} availablePositions
   * @param {*} visitedPositions
   */
  findPosition(matrix, availablePositions, visitedPositions) {
    let foundPos, charPos, position, direction;
    for (let [key, value] of availablePositions) {
      let char = this.getChar(value, matrix);
      if (char && char.match(/(?![x])[a-zA-Z]+/i)) {
        charPos = value;
        direction = key;
      }
      if (!this.isPositionVisited(visitedPositions, value)) {
        position = value;
        direction = key;
        foundPos = true;
        break;
      }
    }
    //  if no available positions go bach on [a-z]/i  i.e. closed circle
    if (!foundPos && charPos) {
      position = charPos;
    }
    return [position, direction];
  }

  /**
   * checks if fork is present on the path.
   * @param {*} direction
   * @param {*} oposite_direction
   * @param {*} matrix
   */
  checkFork(direction, oposite_direction, matrix) {
    return (
      direction &&
      oposite_direction &&
      matrix[direction.x][direction.y] ===
        matrix[oposite_direction.x][oposite_direction.y]
    );
  }
  /**
   *choses first avaliable positions that have not been previously visited
   * @param {} availablePositions
   * @param {*} visitedPositions
   */
  chooseFirstAvailablePosition(availablePositions, visitedPositions) {
    let curPos,
      direction = void 0;
    if (
      availablePositions.get(DOWN) &&
      !this.isPositionVisited(visitedPositions, availablePositions.get(DOWN))
    ) {
      curPos = availablePositions.get(DOWN);
      direction = DOWN;
    } else if (
      availablePositions.get(UP) &&
      !this.isPositionVisited(visitedPositions, availablePositions.get(UP))
    ) {
      curPos = availablePositions.get(UP);
      direction = UP;
    } else if (
      availablePositions.get(LEFT) &&
      !this.isPositionVisited(visitedPositions, availablePositions.get(LEFT))
    ) {
      curPos = availablePositions.get(LEFT);
      direction = LEFT;
    } else if (
      availablePositions.get(RIGHT) &&
      !this.isPositionVisited(visitedPositions, availablePositions.get(RIGHT))
    ) {
      curPos = availablePositions.get(RIGHT);
      direction = RIGHT;
    }
    return [curPos, direction];
  }
  discoverDirection(matrix, curPos, availablePositions, visitedPositions) {
    let currentChar = matrix[curPos.x][curPos.y];
    let position, direction, error;
    if (currentChar === CROSSROADS) {
      if (
        this.checkFork(
          availablePositions.get(UP),
          availablePositions.get(DOWN),
          matrix,
        ) ||
        this.checkFork(
          availablePositions.get(LEFT),
          availablePositions.get(RIGHT),
          matrix,
        )
      ) {
        error = 'T-fork multiple directions available';
        return [void 0, void 0, error];
      }
    }
    // choose first available
    [position, direction] = this.chooseFirstAvailablePosition(
      availablePositions,
      visitedPositions,
    );
    // edge case
    if (!position) {
      [position, direction] = this.findPosition(
        matrix,
        availablePositions,
        visitedPositions,
      );
      !position && (error = 'No more available positions');
    }
    return [position, direction, error];
  }

  updatePathAndLetters(char, visitedPositions, curPos, path, letters) {
    char && path.push(char);
    if (!this.isPositionVisited(visitedPositions, curPos)) {
      if (char && char.match(/(?![x])[a-zA-Z]+/i)) {
        letters.push(char);
      }
    }
  }
  /**
   * recursive function for finding path in matrix
   * @param {*} filename
   * @param {*} curPos
   * @param {*} matrix
   * @param {*} direction
   * @param {*} visitedPositions
   * @param {*} letters
   * @param {*} path
   * @param {*} foundEnd
   * @param {*} hasErrors
   * @param {*} errors
   */
  findNextPostion(
    filename,
    curPos,
    matrix,
    direction,
    visitedPositions,
    letters,
    path,
    errors,
  ) {
    let availablePositions = this.filterSouroundingPositions(curPos, matrix);
    let position, dir, error;
    if (!direction) {
      [position, dir, error] = this.discoverDirection(
        matrix,
        curPos,
        availablePositions,
        visitedPositions,
      );
      if (!position) {
        errors.push(error);
        return;
      }
      curPos = position;
      direction = dir;

      let char = matrix[curPos.x][curPos.y];
      this.updatePathAndLetters(char, visitedPositions, curPos, path, letters);
      if (char && char !== END) {
        visitedPositions.push(curPos);
        if (char && char === CROSSROADS) {
          direction = void 0;
        }
        this.findNextPostion(
          filename,
          curPos,
          matrix,
          direction,
          visitedPositions,
          letters,
          path,
          errors,
        );
      }
    } else {
      // direction defined try to keep it
      position = availablePositions.get(direction);
      // ups blind street :)
      if (!position) {
        [position, dir] = this.chooseFirstAvailablePosition(
          availablePositions,
          visitedPositions,
        );
        if (!position) {
          errors.push(`No available positions to move!`);
          return;
        }
        curPos = position;
        direction = dir;
      } else {
        curPos = position;
      }
      let char = this.getChar(curPos, matrix);
      this.updatePathAndLetters(char, visitedPositions, curPos, path, letters);
      if (char && char !== END) {
        visitedPositions.push(curPos);
        if (char && char === CROSSROADS) {
          direction = void 0;
        }
        this.findNextPostion(
          filename,
          curPos,
          matrix,
          direction,
          visitedPositions,
          letters,
          path,
          errors,
        );
      }
    }
  }
  /**
   * walk trough all input files i.e all input matrix
   */
  walk() {
    this.filematrix.forEach(fileName => {
      let fileErrors = this.isMatrixValid(fileName);
      if (fileErrors) {
        this.results.set(
          fileName,
          new Result(
            [],
            [],
            this.matrix.get(fileName),
            fileName,
            true,
            fileErrors,
          ),
        );
        return;
      }

      let direction = void 0;
      let matrix = this.matrix.get(fileName);
      let startPos = this.startPositions.get(fileName);
      let visitedPositions = new Array();
      visitedPositions.push(startPos);
      let letters = [];
      let path = [START];
      let errors = [];

      this.findNextPostion(
        fileName,
        startPos,
        matrix,
        direction,
        visitedPositions,
        letters,
        path,
        errors,
      );
      // save the result in map
      this.results.set(
        fileName,
        new Result(
          path,
          letters,
          matrix,
          fileName,
          errors && errors.length > 0,
          errors,
        ),
      );
    });
  }
}

module.exports = {
  PathFinder: PathFinder,
  Position: Position,
  Result: Result,
};
