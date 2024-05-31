import { FloorStart, StartRender, getStartRender } from "./FloorStart";
import { FontRender, getFontRender } from "./FontRender";
import { IPlay, StickData } from "./PlayData";
import { PlayerData } from "./StageData";

export class FloorSelect implements IPlay {
    private fontRender: FontRender;
    private maxStage = 0;
    private stageNum = 0;
    private startRender: StartRender;

    public constructor(gl: WebGL2RenderingContext, private playerData: PlayerData) {
        this.fontRender = getFontRender(gl);
        this.startRender = getStartRender(gl);
        this.playerData.loadData().then(maxStage => {
            this.maxStage = maxStage;
            this.stageNum = maxStage;
            // TODO
            /*
            this.maxStage = 60;
            this.playerData.gotItem(ROD_ITEM + ':1');
            this.playerData.gotItem(ROD_ITEM + ':2');
            this.playerData.gotItem(ROD_ITEM + ':3');
            */
        });
    }
    stepFrame(gl: WebGL2RenderingContext, stick: StickData): IPlay {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, 512, 512);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.startRender.draw(gl, 20, 2 + this.stageNum / 2, this.stageNum);

        if (this.maxStage < 1) {
            return this;
        }
        if (stick.isPause(true) || this.maxStage === 1) {
            return new FloorStart(gl, this.playerData, this.stageNum);
        }
        let add = 0;
        if (stick.isUp(true)) {
            add = 10;
        } else if (stick.isDown(true)) {
            add = -10;
        } else if (stick.isRight(true)) {
            add = 1;
        } else if (stick.isLeft(true)) {
            add = -1;
        }
        this.stageNum += add;
        if (this.stageNum < 1) {
            this.stageNum = 1;
        } else if (this.stageNum > this.maxStage) {
            this.stageNum = this.maxStage;
        }
        gl.enable(gl.DEPTH_TEST);
        this.fontRender.draw(gl, "SELECT FLOOR", [-0.7, -0.3, 1.2, 0.1], [0.8, 0.8, 1]);
        let text = "FLOOR " + this.stageNum;
        this.fontRender.draw(gl, text, [-text.length / 20, -0.1, text.length * 0.1, 0.1], [1, 1, 1]);
        return this;
    }
}