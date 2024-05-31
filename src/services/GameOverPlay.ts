import { FontRender, getFontRender } from "./FontRender";
import { IPlay, StickData, saveData } from "./PlayData";
import { StageData } from "./StageData";
import { TitlePlay } from "./TitlePlay";

export class GameOverPlay implements IPlay {
    private count: number = 240;
    private fontRender: FontRender;

    public constructor(gl: WebGL2RenderingContext, stage: StageData) {
        this.fontRender = getFontRender(gl);
        saveData.getSaveData(stage.playerData.saveNum).then(dt => {
            stage.playerData.saveData(Math.max(dt.data.maxStage, stage.floorNum)).then();
        });
    }
    stepFrame(gl: WebGL2RenderingContext, stick: StickData): IPlay {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, 512, 512);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        let text = "GAME OVER";
        this.fontRender.draw(gl, text, [-text.length / 20, -0.05, text.length * 0.1, 0.1], [1, 1, 1]);
        this.count--;
        if (this.count <= 0) {
            // アイテムをランダムで取る
            return new TitlePlay(gl);
        }
        return this;
    }
}