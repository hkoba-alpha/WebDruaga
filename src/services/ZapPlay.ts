import { FloorStart } from "./FloorStart";
import { FontRender, getFontRender } from "./FontRender";
import { IPlay, StickData } from "./PlayData";
import { PlayerData } from "./StageData";

export class ZapPlay implements IPlay {
    private count: number = 180;
    private fontRender: FontRender;

    public constructor(gl: WebGL2RenderingContext, private playerData: PlayerData) {
        this.fontRender = getFontRender(gl);
    }
    stepFrame(gl: WebGL2RenderingContext, stick: StickData): IPlay {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, 512, 512);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        let text = "YOU ZAPPED TO ...";
        this.fontRender.draw(gl, text, [-text.length / 20, -0.05, text.length * 0.1, 0.1], [1, 1, 1]);
        this.count--;
        if (this.count <= 0) {
            // アイテムをランダムで取る
            this.playerData.zap();
            let stg = Math.floor(Math.random() * 8) + 10;
            return new FloorStart(gl, this.playerData, stg, true);
        }
        return this;
    }
}