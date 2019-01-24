import { Skill, SkillBook } from "../game/skills"
import { Game } from "../game/game"
import { GameSession } from "../game/game-session"
import { TouchController } from "./ctrl";
import { GameEvent } from "src/game/events";
import { GameWorldView } from "./game-world-view";

export class GameWorld
{
  session: GameSession
  ctrl: TouchController
  view: GameWorldView

  get game(): Game { return this.session ? this.session.currentGame : null }

  private zone: Phaser.GameObjects.Image

  constructor( public scene:Phaser.Scene, private stageWidth:number, x:number, y:number )
  {
    this.view = new GameWorldView( this.scene, x, y )
    this.view.addBackground()
    this.scene.add.existing( this.view )

    this.ctrl = new TouchController( ( x, y ) => this.moveMayBe( x, y ) )

    this.zone = this.scene.add.image( 0, 0, "tile" )
    this.zone
      .setAlpha( .1 )
      .setTintFill( 0x0 )
      .setScale( 7, 7 )
      .setInteractive( { useHandCursor: true } )
      .on( "pointerdown", e => this.ctrl.start( e.x, e.y ) )
      .on( "pointermove", e => this.ctrl.move( e.x, e.y ) )
      .on( "pointerup", e => this.ctrl.end() )
      .on( "pointerdown", e => { if ( this.game.over ) this.initNextStage() } )
    this.view.add( this.zone )

    this.session = new GameSession
    this.session.events.on( GameEvent.GAMESTART, () => this.buildWorld() )
    this.session.events.on( GameEvent.CHANGE, () => this.onAnyChange() )
    this.session.events.on( GameEvent.BOTDIE, (bot,collision) => 
    {
      this.scene.time.delayedCall(Math.random()*150, () => {
        if ( collision )
        {
          let x = bot.tile.x + Phaser.Math.FloatBetween( -.5, .5 )
          let y = bot.tile.y + Phaser.Math.FloatBetween( -.5, .5 )
          this.view.shockwave( x, y, 2.0 )
          this.view.boom( x,y )
        }
        else
        {
          let x = bot.tile.x
          let y = bot.tile.y
          this.view.shockwave( x, y, 0.5 )
        }
      }, [], this )
    } )
    this.session.reset()

    let skills = SkillBook.makeSkillList()
    for ( let si in skills )
    {
      let label = skills[ si ].icon + " " + skills[ si ].name
      let button:Phaser.GameObjects.Text;
      let x = 50, y = 100 + si * 25
      button = this.scene.add.text( x, y, label, { fill: '#Ff0' } )
      button.setInteractive( { useHandCursor: true } )
      button.on( 'pointerdown', () => this.useSkill( this.session.skills[ si ] ) )
            .on( 'pointerover', () => button.setStyle( { fill: "#FFF" } ) )
            .on( 'pointerout', () => button.setStyle( { fill: "#Ff0" } ) )
    }
  }

  onAnyChange()
  {
    for ( let o of this.view.things )
    {
      let x = o.model.hasOwnProperty( 'x' ) ? o.model.x : ( o.model.tile.x - .1 )
      let y = o.model.hasOwnProperty( 'y' ) ? o.model.y : ( o.model.tile.y - .1 )
      x = ( x - this.game.W * 0.5 + .5 ) * 70 + Phaser.Math.FloatBetween(-1,1)
      y = ( y - this.game.H * 0.5 + .5 ) * 70 + Phaser.Math.FloatBetween(-1,1)

      let fall = o.model.dead || o.model.busted

      this.scene.tweens.add({
        targets: o.view,
        x: x,
        y: y + ( fall ? 30 : 0 ),
        alpha: fall ? 0 : ( o.model.frozen ? .25 : 17 ),
        duration: 100
      })
    }
  }
  
  initNextStage()
  {
    if ( !this.game || !this.game.over )
      return
    if ( this.game.victory )
      this.session.next()
    else
      this.session.reset()
  }

  buildWorld()
  {
    this.view.purgeAllThings()
    this.view.game = this.game

    let g = this.session.currentGame

    for ( let model of g.tiles )
      this.view.addTile( model )

    for ( let model of g.bots )
      this.view.addBot( model )

    this.view.addPlayer( g.player )

    this.zone.setSize( this.game.W * 70, this.game.H * 70 )

    let scale = this.stageWidth / ( this.game.W * 70 + 200 )
    this.view.setScale( scale )
  }

  useSkill( skill:Skill )
  {
    this.session.useSkill( skill )
  }

  moveMayBe( dx: number, dy: number )
  {
    if ( this.game.over )
      return
    let x = this.game.player.tile.x
    let y = this.game.player.tile.y
    let next = this.game.getTile( x + dx, y + dy )
    if ( next )
    {
      this.game.moveTo( next )
      this.game.endTurn()
    }
  }

  ///
}
