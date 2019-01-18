import { Skill } from "../game/skills"
import { Game } from "../game/game"
import { GameSession } from "../game/game-session"

export class GameWorld extends Phaser.GameObjects.Container
{
  public session: GameSession
  public get game(): Game { return this.session ? this.session.currentGame : null }

  private things:any[] = []

  public initialize()
  {
    this.scene.add.existing(this)

    let c = this.scene.add.image(0, 0, "circle")
                          .setBlendMode(Phaser.BlendModes.ADD)
                          .setScale(.5)
    this.add( c )
    this.scene.tweens.add( {
      targets: c,
      rotation: -Math.PI * 2,
      duration: 50000,
      repeat: -1
    } )

    document.addEventListener( "keydown", e => this.onKeyDown(e))

    this.session = new GameSession

    this.resetGame()
  }

  update( duration:number=150 )
  {
    for ( let o of this.things )
    {
      let x = o.model.hasOwnProperty( 'x' ) ? o.model.x : o.model.tile.x
      let y = o.model.hasOwnProperty( 'y' ) ? o.model.y : o.model.tile.y
      x = ( x - this.game.W * 0.5 + .5 ) * 70
      y = ( y - this.game.H * 0.4 + .5 ) * 70

      this.scene.tweens.add({
        targets: o.view,
        x: x,
        y: y,
        alpha: o.model.dead || o.model.busted ? 0 : 1,
        duration: duration
      })
    }
  }
  
  addThing( view:Phaser.GameObjects.GameObject, model:any )
  {
    this.add( view )
    this.things.push( {view:view,model:model})
  }

  continueGame()
  {
    this.session.next()
    this.buildWorld()
  }

  resetGame()
  {
    this.session.reset()
    this.buildWorld()
  }

  buildWorld()
  {
    for (let thing of this.things) thing.destroy()

    let g = this.session.currentGame

    for ( let model of g.tiles )
      this.addThing( this.scene.add.image( 0, 0, 'tile' )
                    .setScale( .55 )
                    .setRotation(.06-0.12*Math.random()), 
                    model )

    for ( let model of g.bots )
      this.addThing( this.scene.add.image( 0, 0, 'bot' )
                    .setScale( .6 ), 
                    model )

    this.addThing( this.scene.add.image( 0, 0, 'bot' )
                  .setScale( .6 )
                  .setTint( 0x00FFFF ), 
                  g.player )

    this.update()
  }

  useSkill( skill:Skill )
  {
    this.session.useSkill( skill )
  }

  moveMayBe( dx: number, dy: number )
  {
    let x = this.game.player.tile.x
    let y = this.game.player.tile.y
    let next = this.game.getTile( x + dx, y + dy )
    if ( next )
    {
      this.game.moveTo( next )
      this.game.endTurn()
    }
    this.update()
  }

  ///

  onKeyDown( e: KeyboardEvent )
  {
    if ( this.game && !this.game.over )
    {
      if ( e.code === "KeyQ" || e.code === "Numpad7" ) this.moveMayBe( -1, -1 )
      if ( e.code === "KeyW" || e.code === "Numpad8" ) this.moveMayBe( 0, -1 )
      if ( e.code === "KeyE" || e.code === "Numpad9" ) this.moveMayBe( 1, -1 )
      if ( e.code === "KeyA" || e.code === "Numpad4" ) this.moveMayBe( -1, 0 )
      if ( e.code === "KeyS" || e.code === "Numpad5" ) this.moveMayBe( 0, 0 )
      if ( e.code === "KeyD" || e.code === "Numpad6" ) this.moveMayBe( 1, 0 )
      if ( e.code === "KeyZ" || e.code === "Numpad1" ) this.moveMayBe( -1, 1 )
      if ( e.code === "KeyX" || e.code === "Numpad2" ) this.moveMayBe( 0, 1 )
      if ( e.code === "KeyC" || e.code === "Numpad3" ) this.moveMayBe( 1, 1 )
      if ( e.code === "KeyF" ) document.documentElement.requestFullscreen()
    }
    else
    {
      ( this.session.gameOver ? this.session.reset : this.session.next )()
    }
  }
}