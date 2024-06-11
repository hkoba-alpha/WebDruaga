import { FloorStart, StartRender, getStartRender } from "./FloorStart";
import { FontRender, getFontRender } from "./FontRender";
import { IPlay, StickData } from "./PlayData";
import { PlayerData, StageLoader } from "./StageData";

export class FloorSelect implements IPlay {
    private fontRender: FontRender;
    private maxStage = 0;
    private stageNum = 0;
    private startRender: StartRender;
    private autoStart = false;
    private lookHeight: number = 1;
    private nearHeight: number = 2.5;
    private stageLoader?: StageLoader;

    public constructor(gl: WebGL2RenderingContext, private playerData: PlayerData, debug = false) {
        this.fontRender = getFontRender(gl);
        this.startRender = getStartRender(gl);
        this.playerData.loadData().then(dt => {
            this.maxStage = dt.maxStage;
            this.stageNum = dt.curStage;
            this.lookHeight = this.stageNum;
            this.nearHeight = 2 + this.stageNum / 2;
            if (!dt.continueFlag) {
                this.autoStart = true;
            }
        });
        if (debug) {
            FloorStart.getStageLoader(Math.floor(this.playerData.saveNum / 5)).then(res => this.stageLoader = res);
        }
    }
    stepFrame(gl: WebGL2RenderingContext, stick: StickData): IPlay {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, 512, 512);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (this.maxStage < 1) {
            return this;
        }

        let look = this.stageNum;
        let near = 2 + this.stageNum / 2;
        this.lookHeight += Math.sign(look - this.lookHeight) * Math.min(0.4, Math.abs(look - this.lookHeight));
        this.nearHeight += Math.sign(near - this.nearHeight) * Math.min(0.2, Math.abs(near - this.nearHeight));

        this.startRender.draw(gl, 20, this.nearHeight, this.lookHeight);

        if (stick.isPause(true) || this.autoStart) {
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
        if (this.stageLoader) {
            // アイテムの取得など
            if (stick.isSword(true)) {
                const dt = this.stageLoader.getData(this.stageNum);
                if (dt.treasure) {
                    this.playerData.gotItem(dt.treasure);
                }
            } else if (stick.isSelect(true)) {
                const dt = this.stageLoader.getData(this.stageNum);
                if (dt.treasure) {
                    this.playerData.lostItem(dt.treasure);
                }
            }
        }
        gl.enable(gl.DEPTH_TEST);
        this.fontRender.draw(gl, "SELECT FLOOR", [-0.7, -0.3, 1.2, 0.1], [0.8, 0.8, 1]);
        let text = "FLOOR " + this.stageNum;
        this.fontRender.draw(gl, text, [-text.length / 20, -0.1, text.length * 0.1, 0.1], [1, 1, 1]);
        return this;
    }
}