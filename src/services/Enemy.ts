import { playDamage, playEffect } from "./SoundData";
import { SpriteData } from "./SpriteData";
import { ARMOR_ITEM, BALANCE_ITEM, BLOCK_SIZE, BOOTS_ITEM, CANDLE_ITEM, DUMMY_ITEM, EnemyData, EnemyEntry, FLOOR_HEIGHT, FLOOR_WIDTH, GUNTLET_ITEM, HELMET_ITEM, HitRect, KEY_ITEM, MEITH_ITEM, NECKLACE_ITEM, PEARL_ITEM, POTION_OF_CURE, POTION_OF_DRAGON_POT, POTION_OF_ENEGY_DRAIN, PlayMode, PlayerData, RING_ITEM, ROD_ITEM, SHIELD_ITEM, STAGE_DARK, STAGE_DEATH, STAGE_HIDDEN_SLIME, STAGE_KILL_DRUAGA, SWORD_ITEM, SpritePosition, StageData, getMoveAdd, setTimerProc } from "./StageData";

export class Slime extends EnemyData {
    /**
     * 12+12+12
     */
    private swingCount: number = 0;
    private waitCount: number = 0;
    private dir: number = 0;
    private visibleFlag = true;

    public constructor(name: string, sprite: SpriteData, private minWait: number, private maxWait: number, private spellType = -1) {
        super(name, sprite);
        this.waitCount = Math.floor(Math.random() * (this.maxWait - this.minWait) + this.minWait);
        this.dir = Math.floor(Math.random() * 4) + 1;
    }
    /**
     * 移動開始時、4int待ちのあと8dot移動, 12int待ちのあと8dot移動, また12int待ちで8dot移動
     * @param gl 
     * @param data 
     */
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.visibleFlag && data.isStageFlag(STAGE_HIDDEN_SLIME)) {
            this.visibleFlag = false;
        }
        if (this.swingCount > 0) {
            // 移動中
            this.swingCount--;
            if (this.swingCount <= 24 && (this.swingCount % 12) === 0) {
                // 移動する
                const add = getMoveAdd(this.dir);
                this.curX += add.ax * 8;
                this.curY += add.ay * 8;
                this.nextX = this.curX;
                this.nextY = this.curY;
            }
            return;
        } else if (this.spellType >= 0 && data.getGlobalCount() === 0) {
            // 呪文
            let spell = this.spellType;
            if (this.spellType > spellNameType.length) {
                // ランダム
                spell = Math.floor(Math.random() * spellNameType.length) + 1;
            }
            let dir = this.dir;
            new Spell(spellNameType[spell], data.getSprite(gl, "Spell"), dir, this, data);
        }
        if (this.waitCount > 0) {
            this.waitCount--;
        } else {
            this.dir = Math.floor(Math.random() * 4) + 1;
            const add = getMoveAdd(this.dir);
            //console.log("Slime", this.curX, this.curY, add);
            if (data.canMove(this.curX / BLOCK_SIZE, this.curY / BLOCK_SIZE, add.ax, add.ay)) {
                // 移動可能
                this.waitCount = Math.floor(Math.random() * (this.maxWait - this.minWait) + this.minWait);
                this.swingCount = 40;
            } else {
                this.waitCount = Math.floor(Math.random() * this.minWait);
            }
        }
    }
    public getSpritePosition(): SpritePosition | null {
        if (!this.visibleFlag) {
            return null;
        }
        let ix = 0;
        if (this.swingCount & 4) {
            ix = (this.swingCount & 2) > 0 ? 2 : 1;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: ix
        };
    }

    @EnemyEntry("WHITE_Slime", { minWait: 10, maxWait: 50, spell: 1 })
    @EnemyEntry("DKYELLOW_Slime", { minWait: 50, maxWait: 200, spell: 5 })
    @EnemyEntry("DKYELLOW_SlimeS", { size: 1, minWait: 50, maxWait: 200, spell: 5 })
    @EnemyEntry("DKYELLOW_SlimeL", { size: 2, minWait: 50, maxWait: 200, spell: 5 })
    @EnemyEntry("DKGREEN_Slime", { minWait: 50, maxWait: 200, spell: 3 })
    @EnemyEntry("DKGREEN_SlimeS", { size: 1, minWait: 50, maxWait: 200, spell: 3 })
    @EnemyEntry("DKGREEN_SlimeL", { size: 2, minWait: 50, maxWait: 200, spell: 3 })
    @EnemyEntry("BLUE_Slime", { minWait: 50, maxWait: 200, spell: 2 })
    @EnemyEntry("BLUE_SlimeS", { size: 1, minWait: 50, maxWait: 200, spell: 2 })
    @EnemyEntry("BLUE_SlimeL", { size: 2, minWait: 50, maxWait: 200, spell: 2 })
    @EnemyEntry("RED_Slime", { minWait: 50, maxWait: 200, spell: 0 })
    @EnemyEntry("RED_SlimeS", { size: 1, minWait: 50, maxWait: 200, spell: 0 })
    @EnemyEntry("RED_SlimeL", { size: 2, minWait: 50, maxWait: 200, spell: 0 })
    @EnemyEntry("BLACK_Slime", { minWait: 10, maxWait: 150 })
    @EnemyEntry("BLACK_SlimeS", { size: 1, minWait: 10, maxWait: 150 })
    @EnemyEntry("BLACK_SlimeL", { size: 2, minWait: 10, maxWait: 150 })
    @EnemyEntry("GREEN_SlimeS", { size: 1, minWait: 60, maxWait: 300 })
    @EnemyEntry("GREEN_SlimeL", { size: 2, minWait: 60, maxWait: 300 })
    @EnemyEntry("GREEN_Slime", { minWait: 60, maxWait: 300 })
    static make_slime(gl: WebGL2RenderingContext, data: StageData, name: string, num: number, option: any): void {
        let sprite = name;
        if ("SL12345".indexOf(name.charAt(name.length - 1)) >= 0) {
            sprite = name.substring(0, name.length - 1);
        }
        if (option.sprite) {
            sprite = option.sprite;
        }
        const minWait = option.minWait || 60;
        const maxWait = option.maxWait || 300;
        const spell = option.spell ?? -1;
        for (let i = 0; i < num; i++) {
            const ene = new Slime(name, data.getSprite(gl, sprite), minWait, maxWait, spell);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}
/**
 * 強さ
 * hp, attack, 回復量
 */
const knightParams: { [name: string]: number[] } = {
    blue: [24, 1, 24, 9, 24],
    black: [48, 1, 48, 21, 48],
    mirror: [48, 1, 48, 21, 48],
    hyper: [96, 1, 96, 48, 96],
    lizard: [96, 2, 96, 48, 96],
    red: [144, 1, 24, 9, 24],
    green_roper: [58, 1, 21],
    red_roper: [58, 1, 21],
    blue_roper: [58, 1, 21],
    quox: [58, 1, 0],
    silver_dragon: [80, 1, 0],
    black_dragon: [112, 1, 0],
    druaga: [96, 1, 0]
};
class Knight extends EnemyData {
    protected dir: number;
    private hitPoint: number;
    private curePoint: number[];
    protected spriteNum = 0;
    /**
     * 移動タイプ
     * 0:プレイヤーに向かわない, 1:プレイヤーに向かって動き続ける, 2:プレイヤーに向かって壁で歩き続ける
     */
    protected moveType = 1;

    constructor(name: string, sprite: SpriteData, private speed: number, private moveDir: number, private param: number[], private defence = 0) {
        super(name, sprite);
        this.dir = Math.floor(Math.random() * 4) + 1;
        this.hitPoint = param[0];
        this.curePoint = param.slice(2);
        this.damagePoint = param[1];
    }
    public getHP(): number {
        return this.hitPoint;
    }
    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        this.spriteNum = Math.floor((data.getGlobalCount() * 6) / this.speed) & 1;
        super.stepFrame(gl, data);
    }
    protected canMove(data: StageData, dir: number, nextDir: number): boolean {
        return true;
    }
    public getDir(): number {
        return this.dir;
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        let nextDir = (this.dir + 3 + this.moveDir) % 4 + 1;
        const pos = data.playerData.getPosition();
        let fix = false;
        if (this.moveType > 0) {
            if (this.curX === pos.x) {
                if (this.curY === pos.y) {
                    // 重なっていた
                    nextDir = (this.dir + 1) % 4 + 1;
                } else {
                    nextDir = this.curY < pos.y ? 3 : 1;
                }
                if (this.moveType === 2) {
                    fix = true;
                }
            } else if (this.curY === pos.y) {
                nextDir = this.curX < pos.x ? 2 : 4;
                if (this.moveType === 2) {
                    fix = true;
                }
            }
        }
        if (!fix) {
            for (let i = 0; i < 4; i++) {
                const add = getMoveAdd(nextDir);
                if (data.canMove(this.curX / BLOCK_SIZE, this.curY / BLOCK_SIZE, add.ax, add.ay)) {
                    break;
                }
                nextDir = (nextDir + 3 - this.moveDir) % 4 + 1;
            }
        }
        if (!this.canMove(data, this.dir, nextDir)) {
            return;
        }
        this.dir = nextDir;
        const add = getMoveAdd(this.dir);
        if (data.canMove(this.curX / BLOCK_SIZE, this.curY / BLOCK_SIZE, add.ax, add.ay)) {
            this.nextX = this.curX + add.ax * BLOCK_SIZE;
            this.nextY = this.curY + add.ay * BLOCK_SIZE;
        }
        this.moveCount = this.speed;
    }
    public getSpritePosition(): SpritePosition | null {
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            //index: (this.dir - 1) * 2 + (((this.curX + this.curY) & 4) >> 2)
            index: (this.dir - 1) * 2 + this.spriteNum
        }
    }
    public getAttackRect(): HitRect {
        if (this.defence > 0) {
            return super.getAttackRect();
        }
        const add = getMoveAdd(this.dir);
        return new HitRect(this.curX + 1 + add.ax * 3, this.curY + 1 + add.ay * 3, this.curX + 15 + add.ax * 3, this.curY + 15 + add.ay * 3);
    }
    protected onDead(data: StageData): void {
        let cure = this.curePoint[0];
        if (this.curePoint.length > 1 && data.playerData.getItem(SWORD_ITEM) > 1) {
            cure = this.curePoint[1];
        }
        data.playerData.addHP(cure);
        super.onDead(data);
    }
    protected gotDamage(data: StageData): void {
        const sw = data.playerData.getItem(SWORD_ITEM);
        if (sw === 0) {
            // ダメージを与えられない
            return;
        }
        let atk = sw > 1 ? 2 : 1;
        atk -= this.defence;
        this.hitPoint -= atk;
        if (this.hitPoint <= 0) {
            this.onDead(data);
        } else {
            playDamage().then();
        }
    }
    protected attacked(data: StageData): void {
        if (data.playerData.getSwordIndex() === 0) {
            // 剣をしまっている
            if (this.defence) {
                // 1 にする
                data.playerData.addHP(-(data.playerData.getHP() - 1));
            } else {
                data.playerData.addHP(-500);
            }
            return;
        }
        super.attacked(data);
    }
    protected checkDamage(player: PlayerData): boolean {
        if (!player.isWalk()) {
            return false;
        }
        return super.checkDamage(player);
    }

    @EnemyEntry("BLIZARD_Knight", { speed: 48, moveDir: 1, param: knightParams.lizard, sprite: "BLUE_LIZARD" })
    @EnemyEntry("LIZARD_Knight", { speed: 48, moveDir: 1, param: knightParams.lizard })
    @EnemyEntry("HYPER_Knight", { speed: 48, moveDir: 1, param: knightParams.hyper })
    @EnemyEntry("MIRROR_Knight2", { speed: 0, moveDir: 1, param: knightParams.mirror, moveCount: 16 })
    @EnemyEntry("MIRROR_Knight", { speed: 0, moveDir: 1, param: knightParams.mirror })
    @EnemyEntry("BLACK_Knight", { speed: 48, moveDir: 1, param: knightParams.black })
    @EnemyEntry("RED_Knight", { speed: 48, moveDir: 1, param: knightParams.red })
    @EnemyEntry("BLUE_Knight", { speed: 48, moveDir: 1, param: knightParams.blue })
    @EnemyEntry("BLUE_Knight2", { speed: 48, moveDir: 1, param: knightParams.blue, moveCount: 16 })
    @EnemyEntry("BLUE_Knight3", { speed: 48, moveDir: 1, param: knightParams.blue })
    static make_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number, option: {
        sprite?: string;
        speed: number;
        moveDir?: number;
        param: number[];
        moveCount?: number;
    }): void {
        let sprite = name;
        if ("SL12345".indexOf(name.charAt(name.length - 1)) >= 0) {
            sprite = name.substring(0, name.length - 1);
        }
        if (option.sprite) {
            sprite = option.sprite;
        }
        let speed = option.speed;
        if (!speed) {
            // Gilと同じ
            speed = data.playerData.hasItem(BOOTS_ITEM) ? 24 : 48;
        }
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, sprite), speed, option.moveDir ?? 1, option.param);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            if (option.moveCount) {
                ene.moveCount = option.moveCount;
            }
            data.addEnemy(ene);
        }
    }
}

/**
 * ドルアーガ用のスーパーナイト
 */
class SuperKnight extends Knight {
    private deadFlag = false;
    private mode = 0;

    constructor(name: string, sprite: SpriteData, private fake: boolean) {
        super(name, sprite, 24, 1, knightParams.hyper);
        this.moveType = 2;
        if (!this.fake) {
            this.mode = 1;
        }
    }
    protected onDead(data: StageData): void {
        super.onDead(data);
        this.deadFlag = true;
    }
    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.mode === 0) {
            if (data.getEnemyList().length === 1) {
                this.mode = 1;
                const pos = data.randomPos();
                this.init(pos.x, pos.y);
            }
            return;
        }
        super.stepFrame(gl, data);
        if (this.deadFlag) {
            if (this.fake) {
                // 偽ドルアーガを出現
                const ene = new Druaga(data.getSprite(gl, "DemonDruaga"), 1);
                const pos = data.randomPos();
                ene.init(pos.x, pos.y);
                data.addEnemy(ene);
            } else {
                // ウィザードを出現
                let wiz: SuperWizard[] = [];
                for (let i = 0; i < 3; i++) {
                    const ene = new SuperWizard(gl, data.getSprite(gl, "WIZARD"), []);
                    data.addEnemy(ene);
                    wiz.push(ene);
                }
                const ene = new SuperWizard(gl, data.getSprite(gl, "WIZARD"), wiz);
                data.addEnemy(ene);
            }
        }
    }
    protected canMove(data: StageData, dir: number, nextDir: number): boolean {
        return true;
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.mode === 0) {
            return null;
        }
        return super.getSpritePosition();
    }

    @EnemyEntry("SUPER_Knight")
    static super_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        data.getSprite(gl, "DemonDruaga");
        data.getSprite(gl, "WIZARD");
        data.getSprite(gl, "QUOX_Dragon");
        const ene = new SuperKnight(name, data.getSprite(gl, "HYPER_Knight"), false);
        const pos = data.randomPos();
        ene.init(pos.x, pos.y);
        data.addEnemy(ene);
    }
    @EnemyEntry("SUPER_Knight2")
    static super_knight2(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        data.getSprite(gl, "DemonDruaga");
        const ene = new SuperKnight(name, data.getSprite(gl, "HYPER_Knight"), true);
        const pos = data.randomPos();
        ene.init(pos.x, pos.y);
        data.addEnemy(ene);
    }
}
class Roper extends Knight {
    constructor(name: string, sprite: SpriteData, speed: number, moveDir: number, param: number[]) {
        super(name, sprite, speed, moveDir, param, 1);
    }

    @EnemyEntry("RED_RoperL", { size: 2, speed: 48, moveDir: 1, param: knightParams.red_roper })
    @EnemyEntry("RED_Roper", { speed: 48, moveDir: 1, param: knightParams.red_roper })
    @EnemyEntry("BLUE_RoperL", { size: 2, speed: 48, moveDir: 1, param: knightParams.blue_roper })
    @EnemyEntry("BLUE_Roper", { speed: 48, moveDir: 1, param: knightParams.blue_roper })
    @EnemyEntry("GREEN_Roper2", { speed: 48, moveDir: 1, param: knightParams.green_roper, moveCount: 8 })
    @EnemyEntry("GREEN_RoperL", { size: 2, speed: 48, moveDir: 1, param: knightParams.green_roper })
    @EnemyEntry("GREEN_Roper", { speed: 48, moveDir: 1, param: knightParams.green_roper })
    static make_roper(gl: WebGL2RenderingContext, data: StageData, name: string, num: number, option: {
        sprite?: string;
        speed: number;
        moveDir?: number;
        param: number[];
        moveCount?: number;
    }): void {
        let sprite = name;
        if ("SL12345".indexOf(name.charAt(name.length - 1)) >= 0) {
            sprite = name.substring(0, name.length - 1);
        }
        if (option.sprite) {
            sprite = option.sprite;
        }
        let speed = option.speed;
        if (!speed) {
            // Gilと同じ
            speed = data.playerData.hasItem(BOOTS_ITEM) ? 24 : 48;
        }
        for (let i = 0; i < num; i++) {
            const ene = new Roper(name, data.getSprite(gl, sprite), speed, option.moveDir ?? 1, option.param);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            if (option.moveCount) {
                ene.moveCount = option.moveCount;
            }
            data.addEnemy(ene);
        }
    }

    public getSpritePosition(): SpritePosition | null {
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: ((this.curX + this.curY) & 8) ? 1 : 0
        };
    }
}
const FIRE_STEP = 8;

export class Dragon extends Knight {
    /**
     * 0:歩いている, 1:左右を見渡す, 2:炎を吐く, 3:壁を壊す, 4:パールで止まっている
     */
    private mode: number = 0;

    /**
     * 上記の 0 以外での残りカウント
     */
    private count: number = 0;

    constructor(name: string, sprite: SpriteData, speed: number, moveDir: number, param: number[]) {
        super(name, sprite, speed, moveDir, param, 1);
    }

    protected isStop(data: StageData): boolean {
        if (data.playerData.getItem(PEARL_ITEM) > 0) {
            const pos = data.playerData.getPosition();
            if (Math.abs(pos.x - this.curX) <= 3 * BLOCK_SIZE && Math.abs(pos.y - this.curY) <= 3 * BLOCK_SIZE) {
                return true;
            }
        }
        return false;
    }
    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        // パールがあると近くでは止まる
        if (this.mode === 0 || this.mode === 4) {
            // パールのチェック
            if (this.isStop(data)) {
                this.mode = 4;
                if (this.count > 0) {
                    this.count--;
                } else {
                    this.count = 32;
                }
                if (this.checkAttack(data.playerData)) {
                    this.attacked(data);
                    if (data.playerData.getHP() === 0) {
                        return;
                    }
                }
                if (this.checkDamage(data.playerData)) {
                    // ダメージを受けた
                    this.gotDamage(data);
                }
                return;
            } else {
                this.mode = 0;
                this.count = 0;
            }
        }
        super.stepFrame(gl, data);
    }
    protected canMove(data: StageData, dir: number, nextDir: number): boolean {
        // プレイヤーと縦横が同じ座標だと壁を壊す
        // まっすぐ進めるのに左右に移動する時はキョロキョロする
        if (this.mode > 0) {
            this.count--;
            if (this.count === 0) {
                let ret = (this.mode === 1);
                this.mode = 0;
                return ret;
            }
            return false;
        }
        const pos = data.playerData.getPosition();
        let bx = this.curX / BLOCK_SIZE;
        let by = this.curY / BLOCK_SIZE;
        let fire = Math.random() < 0.2;
        if (this.name !== "SuperQuox" && pos.x === this.curX) {
            nextDir = pos.y < this.curY ? 1 : 3;
        } else if (this.name !== "SuperQuox" && pos.y === this.curY) {
            nextDir = pos.x < this.curX ? 4 : 2;
        } else if (this.dir !== nextDir) {
            const add = getMoveAdd(this.dir);
            if (data.canMove(bx, by, add.ax, add.ay)) {
                // 左右を向く
                if (!fire) {
                    this.mode = 1;
                    this.count = 128;
                    return false;
                }
            }
        }
        const add = getMoveAdd(nextDir);
        if (!data.canMove(bx, by, add.ax, add.ay)) {
            // 壁を壊す
            data.breakWall(bx, by, nextDir, this.name);
            this.mode = 3;
            this.count = 16;
            this.dir = nextDir;
            return false;
        } else if (fire) {
            // 炎を吐く
            this.dir = nextDir;
            this.mode = 2;
            let max = 5 - (this.dir & 1) * 2;
            for (let i = 1; i < max; i++) {
                if (!data.canMove(bx + add.ax * i, by + add.ay * i, add.ax, add.ay)) {
                    max = i;
                    break;
                }
            }
            let fire = {
                count: 0,
                length: max,
                maxCount: FIRE_STEP * max,
                ax: 1
            };
            this.count = fire.maxCount * 2 + 4;
            data.addDragonFire(() => {
                let len = 1 + fire.count / FIRE_STEP;
                fire.count += fire.ax;
                if (fire.count <= 0) {
                    len = -1;
                } else {
                    if (fire.count >= fire.maxCount) {
                        fire.ax = -1;
                    }
                    if (len > fire.length) {
                        len = fire.length;
                    }
                }
                return {
                    bx: bx,
                    by: by,
                    dir: nextDir,
                    length: len
                };
            });
            return false;
        }
        return true;
    }
    public getSpritePosition(): SpritePosition | null {
        let ix = ((this.curX + this.curY) & 4) >> 2;
        if (this.mode === 1) {
            ix = (this.count & 32) > 0 ? 2 : 3;
        } else if (this.mode === 2 || this.mode === 3) {
            ix = 4;
        } else if (this.mode === 4) {
            ix = (this.count & 16) >> 4;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: (this.dir - 1) * 5 + ix
        };
    }
    protected checkDamage(player: PlayerData): boolean {
        // ドラゴンの場合、向かい合っているとダメージを与えられない
        if (!player.hasItem(POTION_OF_DRAGON_POT) && Math.abs(this.dir - player.getDir()) === 2) {
            return false;
        }
        return super.checkDamage(player);
    }
    protected attacked(data: StageData): void {
        if (data.playerData.hasItem(POTION_OF_DRAGON_POT)) {
            // 一撃
            data.playerData.lostItem(POTION_OF_DRAGON_POT);
            this.onDead(data);
            data.playerData.addHP(-1);
            return;
        }
        super.attacked(data);
    }
    protected gotDamage(data: StageData): void {
        if (data.playerData.hasItem(POTION_OF_DRAGON_POT)) {
            // 一撃
            data.playerData.lostItem(POTION_OF_DRAGON_POT);
            this.onDead(data);
            return;
        }
        super.gotDamage(data);
    }

    @EnemyEntry("BLACK_Dragon", { param: knightParams.black_dragon })
    @EnemyEntry("SILVER_Dragon", { param: knightParams.silver_dragon })
    @EnemyEntry("QUOX_Dragon", { param: knightParams.quox })
    @EnemyEntry("QUOX_DragonL", { size: 2, param: knightParams.quox, sprite: "QUOX_Dragon" })
    static make_dragon(gl: WebGL2RenderingContext, data: StageData, name: string, num: number, option: { param: number[]; sprite?: string; }): void {
        let sprite = option.sprite || name;
        for (let i = 0; i < num; i++) {
            const ene = new Dragon(name, data.getSprite(gl, sprite), 96, 1, option.param);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}
class SuperDragon extends Dragon {
    private deadFlag: boolean = false;
    private hideMode = false;

    public constructor(sprite: SpriteData, private fake: boolean) {
        super("SuperQuox", sprite, 96, 1, knightParams.quox);
        this.hideMode = this.fake;
        this.moveType = 0;
    }
    protected gotDamage(data: StageData): void {
        if (data.playerData.getItem(MEITH_ITEM) > 1) {
            this.onDead(data);
        } else if (this.fake) {
            return super.gotDamage(data);
        }
    }
    protected isStop(data: StageData): boolean {
        return false;
    }
    protected onDead(data: StageData): void {
        super.onDead(data);
        this.deadFlag = true;
    }
    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.hideMode) {
            // 宝箱を取ったら、Quoxをいっぱい生成させる
            if (data.playerData.hasItem(data.getTreasureItem())) {
                // 宝箱を取った
                for (let i = 0; i < 5; i++) {
                    const ene = new Dragon("QUOX_Dragon", data.getSprite(gl, "QUOX_Dragon"), 96, 1, knightParams.quox);
                    const pos = data.randomPos();
                    ene.init(pos.x, pos.y);
                    data.addEnemy(ene);
                }
                const pos = data.randomPos();
                this.init(pos.x, pos.y);
                this.hideMode = false;
            }
            return;
        }
        super.stepFrame(gl, data);
        if (this.deadFlag) {
            const ene = new Druaga(data.getSprite(gl, "DemonDruaga"), this.fake ? 2 : 0);
            if (this.fake) {
                ene.init(this.curX / BLOCK_SIZE, this.curY / BLOCK_SIZE);
            } else {
                const pos = data.randomPos();
                ene.init(pos.x, pos.y);
            }
            data.addEnemy(ene);
        }
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.hideMode) {
            return null;
        }
        return super.getSpritePosition();
    }
    protected checkAttack(player: PlayerData): boolean {
        if (this.hideMode) {
            return false;
        }
        return super.checkAttack(player);
    }
    protected checkDamage(player: PlayerData): boolean {
        if (this.hideMode) {
            return false;
        }
        return super.checkDamage(player);
    }
    @EnemyEntry("SUPER_Dragon2")
    static super_dragon(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        const ene = new SuperDragon(data.getSprite(gl, "QUOX_DRAGON"), true);
        const pos = data.randomPos();
        ene.init(pos.x, pos.y);
        data.addEnemy(ene);
    }
}

class SpellFire extends EnemyData {
    private count: number;
    private srcName: string;
    private deadFlag = false;
    private lastSword = 0;

    constructor(sprite: SpriteData, src: string) {
        super("Spell_Fire", sprite);
        // 128〜255のランダム
        this.count = 128 + Math.floor(Math.random() * 128);
        this.srcName = src;
    }

    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        this.lastSword = data.playerData.getSwordIndex();
        this.count--;
        if (this.count <= 0) {
            data.removeEnemy(this);
            this.moveCount = -1;
            if (this.deadFlag) {
                data.addEvent({
                    type: 'Dead',
                    value: this.name
                });
            }
        }
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.count < 50) {
            if (this.count & 2) {
                return null;
            }
        } else if (this.count < 100) {
            if (this.count & 4) {
                return null;
            }
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: (this.count & 12) >> 2
        };
    }

    protected checkAttack(player: PlayerData): boolean {
        if (player.getItem(NECKLACE_ITEM) > 1) {
            // ネックレスを持っていると触れても大丈夫
            return false;
        }
        return super.checkAttack(player);
    }
    protected checkDamage(player: PlayerData): boolean {
        const atk = player.getAttackRect();
        if (this.count > 16 && this.lastSword === 3 && atk) {
            // 剣を振ると残り16
            const rect = new HitRect(this.curX + 4, this.curY + 4, this.curX + 12, this.curY + 12);
            if (atk.isIntersect(rect)) {
                this.count = 16;
                this.deadFlag = true;
            }
        }
        return false;
    }
}

export const spellNameType = [
    "MAGE_Spell",   // Mage
    "SORCERER_Spell",   // Fire
    "DLUID_Spell",   // Druid
    "WIZARD_Spell"    // Wizard
];

class Spell extends EnemyData {
    private startX: number;
    private startY: number;
    private srcName: string;
    private spellType: number;
    private viewCount = 0;

    constructor(name: string, sprite: SpriteData, private dir: number, src: EnemyData, stage: StageData) {
        super(name, sprite);
        const pos = src.getPosition();
        this.spellType = spellNameType.indexOf(name);
        this.startX = pos.x;
        this.startY = pos.y;
        this.srcName = src.name;
        this.init(this.startX / BLOCK_SIZE, this.startY / BLOCK_SIZE);
        stage.addEnemy(this);
        stage.addEvent({
            type: "Spell",
            value: {
                src: this.srcName,
                type: 0
            }
        });
        playEffect('SpellStart').then();
    }
    private makeFire(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.curX === this.startX && this.curY === this.startY) {
            // 炎は出さない
            return;
        }
        const fire = new SpellFire(data.getSprite(gl, "Spell_Fire"), this.srcName);
        fire.init(this.curX / BLOCK_SIZE, this.curY / BLOCK_SIZE);
        data.addEnemy(fire);
        playEffect('SpellFire').then();
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        const bx = this.curX / BLOCK_SIZE;
        const by = this.curY / BLOCK_SIZE;
        if (this.spellType === 1 && (this.curX !== this.startX || this.curY !== this.startY)) {
            // Fire
            const add1 = getMoveAdd((this.dir % 4) + 1);
            const add2 = getMoveAdd(((this.dir + 2) % 4) + 1);
            if (data.canMove(bx, by, add1.ax, add1.ay) || data.canMove(bx, by, add2.ax, add2.ay)) {
                // 炎に変わる
                data.removeEnemy(this);
                this.moveCount = -1;
                this.makeFire(gl, data);
                return;
            }
        }
        const add = getMoveAdd(this.dir);
        if (this.spellType < 3 && !data.canMove(bx, by, add.ax, add.ay)) {
            // 消える
            data.removeEnemy(this);
            this.moveCount = -1;
            if (this.spellType === 2) {
                // ドルイド
                if (data.breakWall(bx, by, this.dir, this.name) === 1) {
                    // 扉が壊れた
                    data.addEvent({
                        type: "SpellBreak",
                        value: this.srcName
                    });
                }
            } else if (this.spellType === 1) {
                // 炎に変わる
                this.makeFire(gl, data);
            }
            return;
        }
        this.nextX = this.curX + add.ax * BLOCK_SIZE;
        this.nextY = this.curY + add.ay * BLOCK_SIZE;
        if (this.nextX < 0 || this.nextX >= FLOOR_WIDTH * BLOCK_SIZE || this.nextY < 0 || this.nextY >= FLOOR_HEIGHT * BLOCK_SIZE) {
            data.removeEnemy(this);
            this.moveCount = -1;
            return;
        }
        // 4ドット / int
        this.moveCount = 6;
    }
    protected onDead(data: StageData): void {
        data.removeEnemy(this);
        data.addEvent({
            type: "Spell",
            value: {
                src: this.srcName,
                type: Math.abs(this.dir - data.playerData.getDir()) === 2 ? 1 : 2
            }
        });
        playEffect('SpellCatch').then();
    }
    public getAttackRect(): HitRect {
        let sx = this.curX + 1;
        let sy = this.curY + 1;
        let ex = this.curX + 15;
        let ey = this.curY + 15;
        if (this.dir === 1 || this.dir === 3) {
            sx += 4;
            ex -= 4;
        } else {
            sy += 4;
            ey -= 4;
        }
        return new HitRect(sx, sy, ex, ey);
    }
    public getSpritePosition(): SpritePosition | null {
        this.viewCount++;
        if ((this.curX === this.startX && this.curY === this.startY) || (this.viewCount & 2) === 0) {
            // 最初は表示しない
            return null;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: this.spellType * 4 + this.dir - 1
        };
    }
    protected checkDamage(player: PlayerData): boolean {
        const shld = player.getShieldRect();
        if (!shld) {
            return false;
        }
        if (Math.abs(shld.dir - this.dir) !== 2) {
            return false;
        }
        const atk = this.getAttackRect();
        return shld.rect.isIntersect(atk);
    }
    protected checkAttack(player: PlayerData): boolean {
        if (Math.abs(this.startX - this.curX) <= 16 && Math.abs(this.startY - this.curY) <= 16) {
            return false;
        }
        const pos = player.getPosition();
        const rect = new HitRect(pos.x + 4, pos.y + 4, pos.x + 12, pos.y + 12);
        const atk = this.getAttackRect();
        return rect.isIntersect(atk);
    }
    protected attacked(data: StageData): void {
        if (data.playerData.getItem(ARMOR_ITEM) >= 2 && data.playerData.getHP() > 1) {
            // １回だけ受けることができる
            data.playerData.addHP(-(data.playerData.getHP() - 1));
            data.removeEnemy(this);
            data.addEvent({
                type: "Spell",
                value: {
                    src: this.srcName,
                    type: 3
                }
            });
            playEffect('SpellCatch').then();
            return;
        }
        super.attacked(data);
    }
}
const MAGE_VISIBLE_COUNT = 160;

class Magician extends EnemyData {
    /**
     * 次に登場するまでの時間
     */
    protected restCount: number = 0;

    private viewCount: number = 0;
    private dir: number = 0;

    constructor(name: string, sprite: SpriteData, private spellType: number) {
        super(name, sprite);
        this.restCount = 128 + Math.floor(Math.random() * 256);
    }
    public show(data: StageData): boolean {
        // 登場するチェック
        const pos = data.playerData.getPosition();
        // 登場するチェック
        const posList = [
            [0, -2, 3], [0, -3, 3], [1, -2, 3], [2, -1, 4],
            [2, 0, 4], [3, 0, 4], [2, 1, 4], [1, 2, 1],
            [0, 2, 1], [0, 3, 1], [-1, 2, 1], [-2, 1, 2],
            [-2, 0, 2], [-3, 0, 2], [-2, -1, 2], [-1, -2, 3]
        ];
        const ix = Math.floor(Math.random() * posList.length);
        let bx = pos.x / BLOCK_SIZE + posList[ix][0];
        let by = pos.y / BLOCK_SIZE + posList[ix][1];
        if (bx < 0 || bx >= FLOOR_WIDTH || by < 0 || by >= FLOOR_HEIGHT) {
            return false;
        }
        // 他と重なっているとNG
        for (let ene of data.getEnemyList()) {
            if (ene !== this && ene instanceof Magician) {
                const mag = ene as Magician;
                if (mag.viewCount > 0 && bx * BLOCK_SIZE === ene.curX && by * BLOCK_SIZE === ene.curY) {
                    return false;
                }
            }
        }
        // 登場できる
        this.restCount = 0;
        this.viewCount = MAGE_VISIBLE_COUNT;
        this.curX = bx * BLOCK_SIZE;
        this.curY = by * BLOCK_SIZE;
        this.nextX = bx;
        this.nextY = by;
        this.dir = posList[ix][2];
        return true;
    }
    protected onHide(): void {
        this.restCount = 128 + Math.floor(Math.random() * 128);
    }
    protected onShow(data: StageData): void {
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.restCount > 0) {
            this.restCount--;
            return;
        }
        if (this.viewCount > 0) {
            this.viewCount--;
            if (this.viewCount === 0) {
                // 消える
                this.onHide();
            } else if (this.viewCount === MAGE_VISIBLE_COUNT - 50) {
                // 呪文
                new Spell(spellNameType[this.spellType], data.getSprite(gl, "Spell"), this.dir, this, data);
            }
            return;
        }
        // 登場するチェック
        const pos = data.playerData.getPosition();
        if (pos.x % BLOCK_SIZE === 0 && pos.y % BLOCK_SIZE === 0) {
            // 登場するチェック
            if (this.show(data)) {
                this.onShow(data);
            }
        }
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.viewCount > 0) {
            if (this.viewCount < 30 || this.viewCount > MAGE_VISIBLE_COUNT - 30) {
                if (this.viewCount & 4) {
                    return null;
                }
            } else if (this.viewCount < 50 || this.viewCount > MAGE_VISIBLE_COUNT - 50) {
                if (this.viewCount & 2) {
                    return null;
                }
            }
            // 表示する
            return {
                x: this.curX / BLOCK_SIZE,
                y: this.curY / BLOCK_SIZE,
                index: this.dir - 1
            };
        }
        return null;
    }
    protected checkDamage(player: PlayerData): boolean {
        // 消えている間はダメージを受けない
        if (this.viewCount === 0 || this.viewCount > MAGE_VISIBLE_COUNT - 50) {
            return false;
        }
        return super.checkDamage(player);
    }
    protected attacked(data: StageData): void {
        // ダメージは与えない
    }

    @EnemyEntry("WIZARD", { spell: 3 })
    @EnemyEntry("DLUID", { spell: 2 })
    @EnemyEntry("SORCERER", { spell: 1 })
    @EnemyEntry("MAGE", { spell: 0 })
    static make_magician(gl: WebGL2RenderingContext, data: StageData, name: string, num: number, option: { spell: number; }): void {
        for (let i = 0; i < num; i++) {
            const ene = new Magician(name, data.getSprite(gl, name), option.spell);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    public getPosition(): { x: number; y: number; } {
        if (this.viewCount === 0) {
            return {
                x: -1,
                y: -1
            };
        }
        return super.getPosition();
    }
}
class SuperWizard extends Magician {
    private deadFlag: boolean = false;

    public constructor(gl: WebGL2RenderingContext, sprite: SpriteData, private fake: Magician[]) {
        super("SuperWizard", sprite, 3);
        if (this.fake.length > 0) {
            this.restCount = 60;
        } else {
            this.restCount = 999999;
        }
    }
    protected onHide(): void {
        super.onHide();
        if (this.fake.length === 0) {
            // 自分が fake
            // 自分自身では出現処理を実行しない
            this.restCount = 999999;
        }
    }
    protected onShow(data: StageData): void {
        if (this.fake.length > 0) {
            // 他のものも出現させる
            for (let mag of this.fake) {
                while (!mag.show(data)) {
                }
            }
        }
    }
    protected onDead(data: StageData): void {
        if (this.fake.length > 0) {
            // 実態だけが死ぬ
            super.onDead(data);
            for (let ene of this.fake) {
                data.removeEnemy(ene);
            }
            this.deadFlag = true;
        }
    }
    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        super.stepFrame(gl, data);
        if (this.deadFlag) {
            // Quax
            const ene = new SuperDragon(data.getSprite(gl, "QUOX_Dragon"), false);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}

class Ghost extends EnemyData {
    private dir: number;
    private warpCount: number = 0;
    private hitPoint: number = 24;
    private visibleFlag: boolean = true;

    constructor(name: string, sprite: SpriteData, private spellType: number) {
        super(name, sprite);
        this.dir = 3;
    }
    public getHP(): number {
        return this.hitPoint;
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.visibleFlag && !data.playerData.hasItem(CANDLE_ITEM)) {
            this.visibleFlag = false;
        }
        const add = getMoveAdd(this.dir);
        const bx = this.curX / BLOCK_SIZE;
        const by = this.curY / BLOCK_SIZE;
        if (this.warpCount > 0) {
            this.warpCount--;
            if (this.warpCount === 32) {
                // 移動する
                this.curX += add.ax * BLOCK_SIZE;
                this.curY += add.ay * BLOCK_SIZE;
                this.nextX = this.curX;
                this.nextY = this.curY;
                data.addEvent({
                    type: "Warp",
                    value: this.name
                });
            }
            return;
        }
        if (data.canMove(bx, by, add.ax, add.ay)) {
            // そのまま移動する
            this.nextX = this.curX + add.ax * BLOCK_SIZE;
            this.nextY = this.curY + add.ay * BLOCK_SIZE;
            this.moveCount = data.playerData.getItem(BOOTS_ITEM) > 0 ? 24 : 48;
            // 呪文
            if (Math.random() < 0.5) {
                new Spell(spellNameType[this.spellType], data.getSprite(gl, "Spell"), this.dir, this, data);
            }
            return;
        }
        // 方向転換
        const pos = data.playerData.getPosition();
        let nextDir = this.dir;
        if (Math.abs(pos.y - this.curY) > Math.abs(pos.x - this.curX)) {
            // 縦に移動
            nextDir = (pos.y < this.curY) ? 1 : 3;
        } else {
            // 横に移動
            nextDir = (pos.x < this.curX) ? 4 : 2;
        }
        let nextadd = getMoveAdd(nextDir);
        this.dir = nextDir;
        if (data.canMove(bx, by, nextadd.ax, nextadd.ay)) {
            // 進む
            this.nextX = this.curX + nextadd.ax * BLOCK_SIZE;
            this.nextY = this.curY + nextadd.ay * BLOCK_SIZE;
            this.moveCount = data.playerData.getItem(BOOTS_ITEM) > 0 ? 24 : 48;
        } else {
            // ワープ
            this.warpCount = 64;
        }
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.warpCount > 0) {
            if (this.warpCount & 2) {
                return null;
            }
        } else if (!this.visibleFlag) {
            return null;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: this.dir - 1
        };
    }
    protected attacked(data: StageData): void {
        // ダメージは与えない
    }
    protected gotDamage(data: StageData): void {
        const sw = data.playerData.getItem(SWORD_ITEM);
        let atk = 1;
        if (sw > 1) {
            atk++;
            if (sw > 2) {
                atk++;
            }
        } else if (sw === 0) {
            // 偽物はダメージを与えられない
            atk = 0;
        }
        this.hitPoint -= atk;
        if (this.hitPoint <= 0) {
            this.onDead(data);
        } else {
            playDamage();
        }
    }
    protected checkDamage(player: PlayerData): boolean {
        if (this.warpCount > 0) {
            return false;
        }
        return super.checkDamage(player);
    }

    @EnemyEntry("WIZARD_Ghost", { spell: 3 })
    @EnemyEntry("DLUID_Ghost", { spell: 2 })
    @EnemyEntry("MAGE_Ghost", { spell: 0 })
    static make_ghost(gl: WebGL2RenderingContext, data: StageData, name: string, num: number, option: { spell: number; }): void {
        for (let i = 0; i < num; i++) {
            const ene = new Ghost(name, data.getSprite(gl, name), option.spell);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}

export class Wisp extends EnemyData {
    private dir: number;
    private speed: number;
    public turnCount = 0;
    public lastTurn?: {
        bx: number;
        by: number;
    };

    public constructor(name: string, sprite: SpriteData, private red: boolean) {
        super(name, sprite);
        this.dir = Math.floor(Math.random() * 4) + 1;
        this.speed = 48;
        this.moveCount = 60;
    }

    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        let bx = this.curX / BLOCK_SIZE;
        let by = this.curY / BLOCK_SIZE;
        let nextDir = (this.dir + (this.red ? 0 : 2)) % 4 + 1;
        for (let i = 0; i < 4; i++) {
            const add = getMoveAdd(nextDir);
            if (data.canMove(bx, by, add.ax, add.ay)) {
                break;
            }
            nextDir = (nextDir + 3 - (this.red ? 1 : -1)) % 4 + 1;
        }
        if ((nextDir + 4 - this.dir) % 4 === 1) {
            // 右回り
            // 1: (0, -1)
            // 2: (0, 0)
            // 3: (-1, 0)
            // 4: (-1, -1)
            this.lastTurn = {
                bx: this.curX / BLOCK_SIZE - (nextDir >= 3 ? 1 : 0),
                by: this.curY / BLOCK_SIZE - ((nextDir === 1 || nextDir === 4) ? 1 : 0)
            };
            this.turnCount++;
        } else if ((nextDir + 4 - this.dir) % 4 === 3) {
            // 左回り
            // 1:(-1, -1)
            // 2:(0, -1)
            // 3:(0, 0)
            // 4:(-1, 0)
            this.lastTurn = {
                bx: this.curX / BLOCK_SIZE - ((nextDir === 1 || nextDir === 4) ? 1 : 0),
                by: this.curY / BLOCK_SIZE - (nextDir <= 2 ? 1 : 0)
            };
            this.turnCount++;
        }
        const add = getMoveAdd(nextDir);
        this.dir = nextDir;
        this.nextX = this.curX + add.ax * BLOCK_SIZE;
        this.nextY = this.curY + add.ay * BLOCK_SIZE;
        this.moveCount = this.speed;
    }
    public getSpritePosition(): SpritePosition | null {
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: (this.red ? 0 : 2) + (((this.curX + this.curY) & 8) >> 3)
        };
    }

    protected checkAttack(player: PlayerData): boolean {
        // リングを持っているとあたったことにならない
        // 1:青, 2:赤, 3:両方
        let ring = player.getItem(RING_ITEM);
        if (ring > 0) {
            if ((this.red && (ring & 2)) || (!this.red && (ring & 1))) {
                return false;
            }
        }
        return super.checkAttack(player);
    }

    protected checkDamage(player: PlayerData): boolean {
        // ダメージは受けない
        return false;
    }

    @EnemyEntry("RED_Wisp4", { speed: 24, red: true })
    @EnemyEntry("RED_Wisp8", { speed: 12, red: true })
    @EnemyEntry("RED_Wisp", { speed: 48, red: true })
    @EnemyEntry("BLUE_Wisp4", { speed: 24 })
    @EnemyEntry("BLUE_Wisp8", { speed: 12 })
    @EnemyEntry("BLUE_Wisp", { speed: 48 })
    public static make_wisp(gl: WebGL2RenderingContext, data: StageData, name: string, num: number, option: { speed: number; red?: boolean; moveCount?: number; }): void {
        for (let i = 0; i < num; i++) {
            const ene = new Wisp(name, data.getSprite(gl, "Wisp"), option.red || false);
            ene.speed = option.speed;
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            if (option.moveCount) {
                ene.moveCount = option.moveCount;
            } else {
                ene.moveCount = i * option.speed / 2 + option.speed;
            }
            data.addEnemy(ene);
        }
    }
}
class FakeWisp extends Wisp {
    private hitPoint = 34;

    protected checkDamage(player: PlayerData): boolean {
        const attack = player.getAttackRect();
        if (attack) {
            return attack.isHit(this.curX + 7, this.curY + 7);
        }
        return false;
    }
    protected gotDamage(data: StageData): void {
        this.hitPoint--;
        if (this.hitPoint <= 0) {
            super.onDead(data);
        } else {
            playDamage().then();
        }
    }
    protected attacked(data: StageData): void {
        data.playerData.addHP(-1);
    }

    @EnemyEntry("RED_Fake")
    public static redFake(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new FakeWisp(name, data.getSprite(gl, "Wisp"), true);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}

export class DummyExit extends EnemyData {
    public constructor(name: string, spriteData: SpriteData) {
        super(name, spriteData);
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
    }
    public getSpritePosition(): SpritePosition | null {
        return {
            x: this.curX / BLOCK_SIZE,
            y: -0.3,
            index: 0
        };
    }
    protected checkAttack(player: PlayerData): boolean {
        return false;
    }
    protected checkDamage(player: PlayerData): boolean {
        return false;
    }
    @EnemyEntry("DummyExit")
    public static make(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        const doorpos = data.getDoorPos();
        for (let i = 0; i < num; i++) {
            const ene = new DummyExit(name, data.getSprite(gl, "stage"));
            while (true) {
                const pos = data.randomPos();
                if (pos.x !== doorpos.x) {
                    ene.init(pos.x, pos.y);
                    data.addEnemy(ene);
                    break;
                }
            }
        }
    }
}
export class DummyExit2 extends DummyExit {
    /**
     * 0:しまっている, 1: 鍵を取った後, 2:開いている
     */
    private mode = 0;

    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.mode === 0) {
            if (data.playerData.hasItem(KEY_ITEM)) {
                this.mode = 1;
            }
        } else if (this.mode === 1) {
            // 近くに来たら開ける
            const pos = data.playerData.getPosition();
            if (Math.abs(pos.x - this.curX) < BLOCK_SIZE && Math.abs(pos.y - this.curY) < BLOCK_SIZE) {
                this.mode = 2;
            }
        } else {
            // 重なったら戻る
            const pos = data.playerData.getPosition();
            if (pos.x === this.curX && pos.y === this.curY) {
                // 一つ戻る
                data.setPlayMode(PlayMode.ReturnWait);
                data.playerData.setDir(1);
            }
        }
    }

    public getSpritePosition(): SpritePosition | null {
        return {
            x: this.curX / BLOCK_SIZE,
            y: -0.3,
            index: this.mode < 2 ? 5 : 1
        };
    }
}


abstract class DummyTreasure extends EnemyData {
    private initFlag = false;

    protected onInit(gl: WebGL2RenderingContext, data: StageData): void {

    }
    protected abstract onGet(gl: WebGL2RenderingContext, data: StageData): void;

    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (!this.initFlag) {
            this.onInit(gl, data);
            this.initFlag = true;
        }
        const pos = data.playerData.getPosition();
        if (this.curX === pos.x && this.curY === pos.y) {
            // CUREを持っていなければダメ
            this.onGet(gl, data);
            playEffect('ItemGet').then();
            data.removeEnemy(this);
            data.addEvent({
                type: 'Dead',
                value: this.name
            });
        }
    }
    public getSpritePosition(): SpritePosition | null {
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: 3
        };
    }
    protected checkAttack(player: PlayerData): boolean {
        return false;
    }
    protected checkDamage(player: PlayerData): boolean {
        return false;
    }
}
class Excalibur extends DummyTreasure {
    protected onInit(gl: WebGL2RenderingContext, data: StageData): void {
        data.setTreasureItem(POTION_OF_CURE);
    }

    protected onGet(gl: WebGL2RenderingContext, data: StageData): void {
        if (data.playerData.hasItem(POTION_OF_CURE)) {
            data.playerData.gotItem(SWORD_ITEM + ":3");
            data.playerData.lostItem(POTION_OF_CURE);
        } else {
            data.setStageFlag(STAGE_DEATH);
        }
    }

    @EnemyEntry("Excalibur")
    public static excalibur(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Excalibur(name, data.getSprite(gl, "stage"));
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}
class Excalibur2 extends Excalibur {
    private mode = 0;

    public onEvent(data: StageData, options: string[]): void {
        this.mode = 1;
        const tpos = data.getTreasurePos();
        while (true) {
            const pos = data.randomPos();
            if (tpos.x !== pos.x || tpos.y !== pos.y) {
                this.init(pos.x, pos.y);
                break;
            }
        }
    }
    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.mode > 0) {
            super.stepFrame(gl, data);
        }
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.mode === 0) {
            return null;
        }
        return super.getSpritePosition();
    }

    @EnemyEntry("Excalibur2")
    public static excalibur(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Excalibur2(name, data.getSprite(gl, "stage"));
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}
class FakeTreasure extends DummyTreasure {
    private view = false;

    protected onGet(gl: WebGL2RenderingContext, data: StageData): void {
        data.setTreasureItem(DUMMY_ITEM);
    }

    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        if (!this.view) {
            if (data.getTreasure() > 0) {
                const pos = data.randomPos();
                const tpos = data.getTreasurePos();
                if (pos.x !== tpos.x || pos.y !== tpos.y) {
                    this.init(pos.x, pos.y);
                }
                this.view = true;
            }
            return;
        }
        super.stepFrame(gl, data);
    }
    @EnemyEntry("FAKE_Treasure")
    public static fake(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new FakeTreasure(name, data.getSprite(gl, "stage"));
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }

    public getSpritePosition(): SpritePosition | null {
        if (this.view) {
            return super.getSpritePosition();
        }
        return null;
    }
}
class EnergyDrain extends DummyTreasure {
    protected onGet(gl: WebGL2RenderingContext, data: StageData): void {
        data.playerData.gotItem(POTION_OF_ENEGY_DRAIN);
    }

    @EnemyEntry("EnergyDrain")
    public static fake(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new EnergyDrain(name, data.getSprite(gl, "stage"));
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}

export class Saccubus extends EnemyData {
    private index: number = 1;
    private damage: boolean = false;
    private fakeFlag: boolean = false;

    constructor(name: string, sprite: SpriteData) {
        super(name, sprite);
        this.damagePoint = 0;
        if (this.name === 'Saccubus2') {
            this.index = 2;
        }
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.damage) {
            // どんどん減らす
            data.playerData.addHP(-1);
        }
        if (this.index === 1) {
            const pos = data.playerData.getPosition();
            const door = data.getDoorPos();
            if (pos.x === door.x * BLOCK_SIZE && pos.y === door.y * BLOCK_SIZE) {
                this.index = 0;
            }
        } else if (this.index === 2) {
            if (data.playerData.hasItem(KEY_ITEM)) {
                this.index = 0;
            }
        }
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.damage) {
            return null;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: Math.min(1, this.index)
        };
    }
    protected attacked(data: StageData): void {
        if (this.index === 0) {
            this.damage = true;
            if (!this.fakeFlag) {
                // 偽物を撮らせる
                data.playerData.gotItem(ROD_ITEM + ':*');
                this.fakeFlag = true;
            }
        }
    }
    @EnemyEntry("Saccubus")
    public static saccubus(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Saccubus(name, data.getSprite(gl, "Ishtar"));
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("Saccubus2")
    public static saccubus2(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Saccubus(name, data.getSprite(gl, "Ishtar"));
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}


export class Druaga extends EnemyData {
    private dir: number;
    private hitPoint = 96;
    private warpCount = 0;
    /**
     * 0: 消えている
     * 1: 移動
     */
    private mode = 0;
    /**
     * 扉まで逃げる場合
     */
    private escapeDir: number[] = [];

    public constructor(sprite: SpriteData, private fake = 0) {
        super("Druaga", sprite);
        this.dir = Math.floor(Math.random() * 4) + 1;
        this.damagePoint = 1;
        if (this.fake) {
            this.damagePoint = 0;
        } else {
            this.mode = 1;
        }
    }

    public getHP(): number {
        return this.hitPoint;
    }
    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.mode === 0) {
            if (this.fake === 1) {
                if (data.isDoorOpen()) {
                    this.mode = 1;
                    const pos = data.randomPos();
                    this.init(pos.x, pos.y);
                    // 扉までの逃げ道を作成する
                    let mv: number[][] = [];
                    for (let y = 0; y < FLOOR_HEIGHT; y++) {
                        mv.push([]);
                        for (let x = 0; x < FLOOR_WIDTH; x++) {
                            mv[y].push(0);
                        }
                    }
                    mv[pos.y][pos.x] = 1;
                    const dpos = data.getDoorPos();
                    let num = 1;
                    while (mv[dpos.y][dpos.x] === 0) {
                        for (let y = 0; y < FLOOR_HEIGHT; y++) {
                            for (let x = 0; x < FLOOR_WIDTH; x++) {
                                if (mv[y][x] === num) {
                                    // 移動先を探す
                                    if (data.canMove(x, y, 0, -1)) {
                                        if (mv[y - 1][x] === 0) {
                                            mv[y - 1][x] = num + 1;
                                        }
                                    }
                                    if (data.canMove(x, y, 0, 1)) {
                                        if (mv[y + 1][x] === 0) {
                                            mv[y + 1][x] = num + 1;
                                        }
                                    }
                                    if (data.canMove(x, y, 1, 0)) {
                                        if (mv[y][x + 1] === 0) {
                                            mv[y][x + 1] = num + 1;
                                        }
                                    }
                                    if (data.canMove(x, y, -1, 0)) {
                                        if (mv[y][x - 1] === 0) {
                                            mv[y][x - 1] = num + 1;
                                        }
                                    }
                                }
                            }
                        }
                        num++;
                    }
                    // 経路が決まった
                    let x = dpos.x;
                    let y = dpos.y;
                    while (x != pos.x || y != pos.y) {
                        num = mv[y][x] - 1;
                        for (let i = 1; i <= 4; i++) {
                            const add = getMoveAdd(i);
                            if (x - add.ax < 0 || x - add.ax >= FLOOR_WIDTH || y - add.ay < 0 || y - add.ay >= FLOOR_HEIGHT) {
                                continue;
                            }
                            if (mv[y - add.ay][x - add.ax] === num && data.canMove(x, y, -add.ax, -add.ay)) {
                                this.escapeDir.unshift(i);
                                x -= add.ax;
                                y -= add.ay;
                                break;
                            }
                        }
                    }
                }
            } else {
                // 出口まで一直線
                const dpos = data.getDoorPos();
                if (this.curX % BLOCK_SIZE) {
                    // 左右に調整
                    if (this.curX < dpos.x * BLOCK_SIZE) {
                        this.curX++;
                        this.dir = 2;
                    } else {
                        this.curX--;
                        this.dir = 4;
                    }
                    this.nextX = this.curX;
                } else if (this.curY % BLOCK_SIZE) {
                    // 上下に調整
                    if (this.curY < dpos.y * BLOCK_SIZE) {
                        this.curY++;
                        this.dir = 3;
                    } else {
                        this.curY--;
                        this.dir = 1;
                    }
                    this.nextY = this.curY;
                } else {
                    // 移動ルートを作成する
                    // 少しの間止まっている
                    this.moveCount = BLOCK_SIZE * 2;
                    this.mode = 1;
                    let dx = dpos.x - this.curX / BLOCK_SIZE;
                    let dy = dpos.y - this.curY / BLOCK_SIZE;
                    while (dx) {
                        if (dx < 0) {
                            this.escapeDir.push(4);
                            dx++;
                        } else {
                            this.escapeDir.push(2);
                            dx--;
                        }
                    }
                    while (dy) {
                        if (dy < 0) {
                            this.escapeDir.push(1);
                            dy++;
                        } else {
                            this.escapeDir.push(3);
                            dy--;
                        }
                    }
                }
            }
            return;
        }
        super.stepFrame(gl, data);
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.warpCount > 0) {
            this.warpCount--;
            const add = getMoveAdd(this.dir);
            if (this.warpCount === 32) {
                // 移動する
                this.curX += add.ax * BLOCK_SIZE;
                this.curY += add.ay * BLOCK_SIZE;
                this.nextX = this.curX;
                this.nextY = this.curY;
                data.addEvent({
                    type: "Warp",
                    value: this.name
                });
            }
            return;
        }
        let nextDir: number = 0;
        let bx = this.curX / BLOCK_SIZE;
        let by = this.curY / BLOCK_SIZE;
        if (this.fake) {
            if (this.escapeDir.length > 0) {
                nextDir = this.escapeDir.shift()!;
            } else {
                this.curY -= 0.1;
                if (this.curY < -2) {
                    data.removeEnemy(this);
                    data.setStageFlag(STAGE_KILL_DRUAGA);
                }
                return;
            }
        } else {
            nextDir = (this.dir % 4) + 1;
            const pos = data.playerData.getPosition();
            if (this.curX === pos.x) {
                // 縦に動く
                if (pos.y < this.curY) {
                    nextDir = 1;
                } else if (pos.y > this.curY) {
                    nextDir = 3;
                } else {
                    // 重なっている
                    nextDir = (this.dir + 1) % 4 + 1;
                }
            } else if (this.curY === pos.y) {
                if (pos.x < this.curX) {
                    nextDir = 4;
                } else {
                    nextDir = 2;
                }
            } else {
                for (let i = 0; i < 4; i++) {
                    const add = getMoveAdd(nextDir);
                    if (data.canMove(bx, by, add.ax, add.ay)) {
                        break;
                    }
                    nextDir = (nextDir + 2) % 4 + 1;
                }
            }
        }
        const add = getMoveAdd(nextDir);
        if (!data.canMove(bx, by, add.ax, add.ay)) {
            // ワープする
            this.warpCount = 64;
            this.dir = nextDir;
            return;
        } else if (this.dir === nextDir) {
            // 呪文チェック
            if (Math.random() < 0.3) {
                // 呪文
                new Spell(spellNameType[3], data.getSprite(gl, "Spell"), nextDir, this, data);
            }
        }
        this.dir = nextDir;
        this.nextX = this.curX + add.ax * BLOCK_SIZE;
        this.nextY = this.curY + add.ay * BLOCK_SIZE;
        this.moveCount = 24;
    }

    public getSpritePosition(): SpritePosition | null {
        if ((this.warpCount & 2) || this.mode === 0) {
            return null;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: (((this.curX + this.curY) & 8) >> 3)
        };
    }
    protected checkDamage(player: PlayerData): boolean {
        if (this.warpCount > 0 || this.fake) {
            return false;
        }
        return super.checkDamage(player);
    }
    protected checkAttack(player: PlayerData): boolean {
        if (this.fake) {
            return false;
        }
        return super.checkAttack(player);
    }
    protected gotDamage(data: StageData): void {
        // 最強装備じゃないと倒せない
        if (data.playerData.getItem(SWORD_ITEM) < 3 || data.playerData.getItem(SHIELD_ITEM) < 2 || data.playerData.getItem(ARMOR_ITEM) < 2 || data.playerData.getItem(HELMET_ITEM) < 1 || data.playerData.getItem(GUNTLET_ITEM) < 2) {
            data.playerData.addHP(-data.playerData.getHP());
            return;
        }
        this.hitPoint--;
        if (this.hitPoint <= 0) {
            this.onDead(data);
        }
    }
    protected onDead(data: StageData): void {
        super.onDead(data);
        data.setStageFlag(STAGE_KILL_DRUAGA);
    }
    protected attacked(data: StageData): void {
        if (data.playerData.getSwordIndex() === 0) {
            // 剣をだしていない
            data.playerData.addHP(-(data.playerData.getHP() - 1));
        } else {
            super.attacked(data);
        }
    }
}

export class IshtarKai extends EnemyData {
    /**
     * 
     * @param name 
     * @param sprite 
     * @param index 0:イシター, 1:石, 2:カイ, 3:歩いているカイ,-1:偽物イシター
     */
    constructor(name: string, sprite: SpriteData, private index: number) {
        super(name, sprite);
        this.damagePoint = 0;
    }
    public setIndex(index: number): void {
        this.index = index;
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.index === 3) {
            const pos = data.playerData.getPosition();
            if (pos.x > this.curX + BLOCK_SIZE) {
                this.curX = pos.x - BLOCK_SIZE;
                this.nextX = this.curX;
            }
        } else if (this.index < 0) {
            const tm = data.getTimer();
            if (tm < 18000) {
                this.index = -1;
            } else if (tm > 19500 || tm < 18500) {
                this.index = (tm & 4) ? -1 : -2;
            } else {
                this.index = -2;
            }
        }
    }
    public getSpritePosition(): SpritePosition | null {
        let ix = this.index;
        if (ix === 3) {
            ix = (this.curX & 8) > 0 ? 4 : 3;
        } else if (ix < 0) {
            if (ix === -1) {
                return null;
            }
            ix = 0;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: ix
        };
    }

    protected checkDamage(player: PlayerData): boolean {
        if (this.index < 0 || this.index === 1) {
            return false;
        }
        return super.checkDamage(player);
    }
    protected onDead(data: StageData): void {
        if (data.isLastFloor()) {
            data.setPlayMode(PlayMode.ZapWait);
        } else {
            super.onDead(data);
        }
    }
    protected checkAttack(player: PlayerData): boolean {
        return false;
    }

    @EnemyEntry("Ishtar")
    public static ishtar(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        const ene = new IshtarKai("Ishtar", data.getSprite(gl, 'Ishtar'), 0);
        ene.init(FLOOR_WIDTH - 1, 4);
        data.addEnemy(ene);
    }
    @EnemyEntry("Ishtar2")
    public static ishtar2(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        const ene = new IshtarKai("Ishtar", data.getSprite(gl, 'Ishtar'), -1);
        ene.init(FLOOR_WIDTH - 1, 4);
        data.addEnemy(ene);
    }
    @EnemyEntry("Kai")
    public static kai(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        const ene = new IshtarKai("Kai", data.getSprite(gl, 'Ishtar'), 1);
        ene.init(0, 4);
        data.addEnemy(ene);
    }
    @EnemyEntry("Kai2")
    public static kai2(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        const ene = new IshtarKai("Kai", data.getSprite(gl, 'Ishtar'), 1);
        ene.init(9, 4);
        data.addEnemy(ene);
    }
}

export class ItemEnemy extends EnemyData {
    private itemName: string = "";

    public constructor(name: string, sprite: SpriteData, public readonly index: number) {
        super(name, sprite);
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.itemName) {
            const pos = data.playerData.getPosition();
            if (this.curX === pos.x && this.curY === pos.y) {
                data.playerData.gotItem(this.itemName);
                data.removeEnemy(this);
            }
        }
    }
    public setItemName(name: string): void {
        this.itemName = name;
    }
    public getSpritePosition(): SpritePosition | null {
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: this.index
        };
    }
    protected checkAttack(player: PlayerData): boolean {
        return false;
    }
    protected onDead(data: StageData): void {
        // ZAP
        data.setPlayMode(PlayMode.ZapWait);
    }
}

setTimerProc((gl, data) => {
    if (data.isRedTime()) {
        switch (data.getTimer()) {
            case 60:
                Wisp.make_wisp(gl, data, "BLUE_Wisp", 1, { speed: 48, moveCount: 60 })
                break;
            case 55:
                Wisp.make_wisp(gl, data, "RED_Wisp", 1, { speed: 48, red: true, moveCount: 60 })
                break;
            case 50:
                Wisp.make_wisp(gl, data, "BLUE_Wisp", 1, { speed: 12, moveCount: 60 })
                break;
            case 45:
                Wisp.make_wisp(gl, data, "RED_Wisp", 1, { speed: 12, red: true, moveCount: 60 })
                break;
        }
    }
});

/**
 * フロアを暗くする
 */
class DarkFloor extends EnemyData {
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        let flag = false;
        if (data.getFireList().length > 0) {
            data.clearStageFlag(STAGE_DARK);
        } else {
            data.setStageFlag(STAGE_DARK);
        }
    }
    public getSpritePosition(): SpritePosition | null {
        return null;
    }
    protected checkAttack(player: PlayerData): boolean {
        return false;
    }
    protected checkDamage(player: PlayerData): boolean {
        return false;
    }

    @EnemyEntry("Dark")
    public static dark(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        const ene = new DarkFloor("Dark", data.getSprite(gl, 'Ishtar'));
        ene.init(0, 0);
        data.addEnemy(ene);
    }
}