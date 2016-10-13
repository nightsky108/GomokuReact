import React, {Component, PropTypes} from 'react'
import GameTile from './GameTile'
import {emitBoard} from '../models/game'

class GameBoard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      board: [],
      p1Turn: true,
      p2Turn: false
    }
    // bind your event handlers in the constructor so they are only bound once for every instance
    this._updatePlayerMove = this._updatePlayerMove.bind(this)
  }

  componentDidMount() {
    this._initializeBoard()
    socket.on('player move', data => this._updateBoard(data))
  }

  _updateBoard(data) {
    if(data.gameID === this.props.gameID) {
      this.setState({
        p1Turn: !this.state.p1Turn,
        p2Turn: !this.state.p2Turn
      })
      this.setState({
        board: data.board
      })
    }
  }

  _initializeBoard() {
    const board = []
    const rows = 'ABCDEFGHIJKLMNO'.split('')
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

    rows.forEach(row => {
      const Row = []
      cols.forEach(col => {
        Row.push({
          id: row + col,
          player: 0
        })
      })
      board.push(Row)
    })
    this.setState({board})
  }

  _createTiles(tiles) {
    const b = []
    tiles.forEach(ele => b.push(...ele))
    let isTurn = false
    if(this.props.player === 1 && this.state.p1Turn) {
      isTurn = true
    }
    if(this.props.player === 2 && this.state.p2Turn) {
      isTurn = true
    }

    return b.map((tile, i) => {
      return(
        <GameTile
          isTurn={isTurn}
          player={tile.player}
          id={tile.id}
          key={i}
          updatePlayerMove={this._updatePlayerMove}
        />
      )
    })
  }

  _updatePlayerMove(id) {
    const b = []
    this.state.board.forEach(ele => b.push(...ele))
    b.forEach(tile => {
      if(tile.id === id) {
        tile.player = this.props.player
      }
    })
    this._isWin(this.state.board, this.props.player)
  }

  _isWin(board, p) {
    // vertical, horizontal, diagonal each create a string from P1 & P2 tile values
    // a 0 value is inserted after each row to create a break
    // regex then checks for 5 in a row
    const b = []
    board.forEach(ele => b.push(...ele))

    const rows = 'ABCDEFGHIJKLMNO'.split('')
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

    function horizontal(b, p) {
      const Row = []
      rows.forEach(char => {
        b.forEach(item => {
          if(item.id.slice(0, 1) === char) {
            Row.push(item.player.toString())
          }
        })
        Row.push('0')
      })
      return /(1{5,5})|(2{5,5})/.test(Row.join(''))
    }

    function vertical(b, p) {
      const Col = []
      cols.forEach(char => {
        b.forEach(item => {
          if(+item.id.slice(1) === char) {
            Col.push(item.player.toString())
          }
        })
        Col.push('0')
      })
      return /(1{5,5})|(2{5,5})/.test(Col.join(''))
    }

    function diagonal(board, p) {
      const diagonals = []
      for(let i = 0; i < board.length; i++) {
        const diagonal = []
        for(let j = 0; j < board[i].length; j++) {
          diagonal.push(board[i][j].player)
        }
        diagonals.push(diagonal)
      }

      function getDiagonals(array, bottomToTop) {
        let Ylength = array.length
        let Xlength = array[0].length
        let maxLength = Math.max(Xlength, Ylength)
        let temp
        let returnArray = []
        for(let k = 0; k <= 2 * (maxLength - 1); ++k) {
          temp = []
          for(let y = Ylength - 1; y >= 0; --y) {
            let x = k - (bottomToTop ? Ylength - y : y)
            if(x >= 0 && x < Xlength) {
              temp.push(array[y][x])
            }
          }
          if(temp.length > 0) {
            returnArray.push(temp.join(''))
          }
        }
        return returnArray;
      }

      const diagonalsRight = getDiagonals(diagonals, true)
      const diagonalsLeft = getDiagonals(diagonals, false)
      const d = []

      diagonalsRight.forEach(ele => {
        d.push(...ele, '0')
      })
      diagonalsLeft.forEach(ele => {
        d.push(...ele, '0')
      })
      return /(1{5,5})|(2{5,5})/.test(d.join(''))
    }


    if(horizontal(b, p) || vertical(b, p) || diagonal(board, p)) {
      console.log('Player', p, 'Won')
      socket.emit('player won', {
        gameID: this.props.gameID,
        player: p
      })
    }

    this.setState({board})

    socket.emit('player move', {
      gameID: this.props.gameID,
      board: board
    })
  }

  render() {
    const Tiles = this._createTiles(this.state.board)
    return(
      <div>{Tiles}</div>
    )
  }
}


GameBoard.propTypes = {
  gameID: PropTypes.string.isRequired
}

export default GameBoard
