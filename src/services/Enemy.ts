import { playDamage, playEffect } from "./SoundData";
import { SpriteData } from "./SpriteData";
import { ARMOR_ITEM, BALANCE_ITEM, BLOCK_SIZE, BOOTS_ITEM, CANDLE_ITEM, EnemyData, EnemyEntry, FLOOR_HEIGHT, FLOOR_WIDTH, GUNTLET_ITEM, HELMET_ITEM, HitRect, MEITH_ITEM, NECKLACE_ITEM, PEARL_ITEM, POTION_OF_CURE, POTION_OF_DRAGON_POT, PlayMode, PlayerData, RING_ITEM, ROD_ITEM, SHIELD_ITEM, STAGE_DEATH, STAGE_KILL_DRUAGA, SWORD_ITEM, SpritePosition, StageData, getMoveAdd, setTimerProc } from "./StageData";

export class Slime extends EnemyData {
    /**
     * 12+12+12
     */
    private swingCount: number = 0;
    private waitCount: number = 0;
    private dir: number = 0;

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

    @EnemyEntry("GREEN_Slime")
    static green_slime(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Slime(name, data.getSprite(gl, name), 60, 300);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLACK_Slime")
    static black_slime(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Slime(name, data.getSprite(gl, name), 10, 150);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("RED_Slime")
    static red_slime(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Slime(name, data.getSprite(gl, name), 50, 200, 0);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLUE_Slime")
    static blue_slime(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Slime(name, data.getSprite(gl, name), 50, 200, 2);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }

    @EnemyEntry("DKGREEN_Slime")
    static dkgreen_slime(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Slime(name, data.getSprite(gl, name), 50, 200, 3);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("DKYELLOW_Slime")
    static dkyellow_slime(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Slime(name, data.getSprite(gl, name), 50, 200, 5);
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
    protected canMove(data: StageData, dir: number, nextDir: number): boolean {
        return true;
    }
    public getDir(): number {
        return this.dir;
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        let nextDir = (this.dir + 3 + this.moveDir) % 4 + 1;
        const pos = data.playerData.getPosition();
        if (this.curX === pos.x) {
            nextDir = this.curY < pos.y ? 3 : 1;
        } else if (this.curY === pos.y) {
            nextDir = this.curX < pos.x ? 2 : 4;
        }
        for (let i = 0; i < 4; i++) {
            const add = getMoveAdd(nextDir);
            if (data.canMove(this.curX / BLOCK_SIZE, this.curY / BLOCK_SIZE, add.ax, add.ay)) {
                break;
            }
            nextDir = (nextDir + 3 - this.moveDir) % 4 + 1;
        }
        if (!this.canMove(data, this.dir, nextDir)) {
            return;
        }
        this.dir = nextDir;
        const add = getMoveAdd(this.dir);
        this.nextX = this.curX + add.ax * BLOCK_SIZE;
        this.nextY = this.curY + add.ay * BLOCK_SIZE;
        this.moveCount = this.speed;
    }
    public getSpritePosition(): SpritePosition | null {
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: (this.dir - 1) * 2 + (((this.curX + this.curY) & 4) >> 2)
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
            playDamage();
        }
    }
    protected attacked(data: StageData): void {
        if (data.playerData.getSwordIndex() === 0) {
            // 剣をしまっている
            if (this.defence) {
                // 1 にする
                data.playerData.addHP(-(data.playerData.getHP() - 1));
            } else {
                data.playerData.addHP(-200);
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

    @EnemyEntry("RED_Knight")
    static red_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, name), 48, 1, knightParams.red);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLUE_Knight")
    static blue_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, "BLUE_Knight"), 48, 1, knightParams.blue);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLUE_Knight2")
    static blue_knight2(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, "BLUE_Knight"), 48, 1, knightParams.blue);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            ene.moveCount = 16;
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLACK_Knight")
    static black_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, name), 48, 1, knightParams.black);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("MIRROR_Knight")
    static mirror_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        let speed = 48;
        if (data.playerData.getItem(BOOTS_ITEM) > 0) {
            speed = 24;
        }
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, name), speed, 1, knightParams.mirror);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("MIRROR_Knight2")
    static mirror_knight2(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        let speed = 48;
        if (data.playerData.getItem(BOOTS_ITEM) > 0) {
            speed = 24;
        }
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, "MIRROR_Knight"), speed, 1, knightParams.mirror);
            ene.moveCount = 8;
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("HYPER_Knight")
    static hyper_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        let speed = 48;
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, name), speed, 1, knightParams.hyper);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("LIZARD_Knight")
    static lizard_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        let speed = 48;
        for (let i = 0; i < num; i++) {
            const ene = new Knight(name, data.getSprite(gl, name), speed, 1, knightParams.lizard);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }

}

/**
 * ドルアーガ用のスーパーナイト
 */
class SuperKnight extends Knight {
    private deadFlag = false;
    constructor(name: string, sprite: SpriteData) {
        super(name, sprite, 24, 1, knightParams.hyper);
    }
    protected onDead(data: StageData): void {
        super.onDead(data);
        this.deadFlag = true;
    }
    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        super.stepFrame(gl, data);
        if (this.deadFlag) {
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

    @EnemyEntry("SUPER_Knight")
    static super_knight(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        data.getSprite(gl, "DamonDruaga");
        data.getSprite(gl, "WIZARD");
        data.getSprite(gl, "QUOX_Dragon");
        const ene = new SuperKnight(name, data.getSprite(gl, "HYPER_Knight"));
        const pos = data.randomPos();
        ene.init(pos.x, pos.y);
        data.addEnemy(ene);
    }
}
class Roper extends Knight {
    constructor(name: string, sprite: SpriteData, speed: number, moveDir: number, param: number[]) {
        super(name, sprite, speed, moveDir, param, 1);
    }
    @EnemyEntry("GREEN_Roper")
    static green_roper(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        let speed = 48;
        for (let i = 0; i < num; i++) {
            const ene = new Roper(name, data.getSprite(gl, name), speed, 1, knightParams.green_roper);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("GREEN_Roper2")
    static green_roper2(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        let speed = 48;
        for (let i = 0; i < num; i++) {
            const ene = new Roper(name, data.getSprite(gl, "GREEN_Roper"), speed, 1, knightParams.green_roper);
            ene.moveCount = 8;
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("RED_Roper")
    static red_roper(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        let speed = 48;
        for (let i = 0; i < num; i++) {
            const ene = new Roper(name, data.getSprite(gl, name), speed, 1, knightParams.red_roper);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLUE_Roper")
    static blue_roper(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        let speed = 48;
        for (let i = 0; i < num; i++) {
            const ene = new Roper(name, data.getSprite(gl, name), speed, 1, knightParams.blue_roper);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
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
        if (pos.x === this.curX) {
            nextDir = pos.y < this.curY ? 1 : 3;
        } else if (pos.y === this.curY) {
            nextDir = pos.x < this.curX ? 4 : 2;
        } else if (this.dir !== nextDir) {
            const add = getMoveAdd(this.dir);
            if (data.canMove(bx, by, add.ax, add.ay)) {
                // 左右を向く
                this.mode = 1;
                this.count = 128;
                return false;
            }
        }
        const add = getMoveAdd(nextDir);
        if (!data.canMove(bx, by, add.ax, add.ay)) {
            // 壁を壊す
            data.breakWall(bx, by, nextDir);
            this.mode = 3;
            this.count = 16;
            this.dir = nextDir;
            return false;
        } else if (this.dir === nextDir && Math.random() < 0.2) {
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

    @EnemyEntry("QUOX_Dragon")
    static quox_dragon(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Dragon(name, data.getSprite(gl, name), 96, 1, knightParams.quox);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("SILVER_Dragon")
    static silver_dragon(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Dragon(name, data.getSprite(gl, name), 96, 1, knightParams.silver_dragon);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLACK_Dragon")
    static black_dragon(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Dragon(name, data.getSprite(gl, name), 96, 1, knightParams.black_dragon);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}
class SuperDragon extends Dragon {
    private deadFlag: boolean = false;

    public constructor(sprite: SpriteData) {
        super("SuperQuox", sprite, 48, 1, knightParams.quox);
    }
    protected gotDamage(data: StageData): void {
        if (data.playerData.getItem(MEITH_ITEM) > 1) {
            this.onDead(data);
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
        super.stepFrame(gl, data);
        if (this.deadFlag) {
            const ene = new Druaga(data.getSprite(gl, "DemonDruaga"));
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}

class SpellFire extends EnemyData {
    private count: number;
    private srcName: string;

    constructor(sprite: SpriteData, src: string) {
        super("Spell_Fire", sprite);
        // 128〜255のランダム
        this.count = 128 + Math.floor(Math.random() * 128);
        this.srcName = src;
    }

    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        this.count--;
        if (this.count <= 0) {
            data.removeEnemy(this);
            this.moveCount = -1;
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
        if (this.count > 16 && atk) {
            // 剣を振ると残り16
            if (atk.isHit(this.curX + 7, this.curY + 7)) {
                this.count = 16;
            }
        }
        return false;
    }
}

export const spellNameType = [
    "Spell1",   // Mage
    "Spell2",   // Fire
    "Spell3",   // Druid
    "Spell4"    // Wizard
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
                if (data.breakWall(bx, by, this.dir) === 1) {
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
        if (this.startX === this.curX && this.startY === this.curY) {
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
        this.restCount = 128 + Math.floor(Math.random() * 256);
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

    @EnemyEntry("MAGE")
    static mage(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Magician(name, data.getSprite(gl, name), 0);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("SORCERER")
    static sorcerer(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Magician(name, data.getSprite(gl, name), 1);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("DLUID")
    static druid(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Magician(name, data.getSprite(gl, name), 2);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("WIZARD")
    static wizard(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Magician(name, data.getSprite(gl, name), 3);
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
            const ene = new SuperDragon(data.getSprite(gl, "QUOX_Dragon"));
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

    @EnemyEntry("MAGE_Ghost")
    static mage(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Ghost(name, data.getSprite(gl, name), 0);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("DLUID_Ghost")
    static druid(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Ghost(name, data.getSprite(gl, name), 2);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("WIZARD_Ghost")
    static wizard(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Ghost(name, data.getSprite(gl, name), 3);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}

export class Wisp extends EnemyData {
    private dir: number;
    private speed: number;

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

    @EnemyEntry("BLUE_Wisp")
    public static blue(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Wisp(name, data.getSprite(gl, "Wisp"), false);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLUE_Wisp8")
    public static blue8(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Wisp(name, data.getSprite(gl, "Wisp"), false);
            ene.speed = 12;
            ene.moveCount = i * 8 + 8;
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("BLUE_Wisp4")
    public static blue4(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Wisp(name, data.getSprite(gl, "Wisp"), false);
            ene.speed = 24;
            ene.moveCount = i * 4 + 4;
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("RED_Wisp")
    public static red(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Wisp(name, data.getSprite(gl, "Wisp"), true);
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("RED_Wisp4")
    public static red4(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Wisp(name, data.getSprite(gl, "Wisp"), true);
            ene.speed = 24;
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
    @EnemyEntry("RED_Wisp8")
    public static red8(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Wisp(name, data.getSprite(gl, "Wisp"), true);
            ene.speed = 12;
            const pos = data.randomPos();
            ene.init(pos.x, pos.y);
            data.addEnemy(ene);
        }
    }
}

class DummyExit extends EnemyData {
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
    public static red(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
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

class Excalibur extends EnemyData {
    private initFlag = false;

    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
        if (!this.initFlag) {
            data.setTreasureItem(POTION_OF_CURE);
            this.initFlag = true;
        }
        const pos = data.playerData.getPosition();
        if (this.curX === pos.x && this.curY === pos.y) {
            // CUREを持っていなければダメ
            if (data.playerData.hasItem(POTION_OF_CURE)) {
                data.playerData.gotItem(SWORD_ITEM + ":3");
                data.playerData.lostItem(POTION_OF_CURE);
            } else {
                data.setStageFlag(STAGE_DEATH);
            }
            playEffect('ItemGet').then();
            data.removeEnemy(this);
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
    @EnemyEntry("Excalibur")
    public static red(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        for (let i = 0; i < num; i++) {
            const ene = new Excalibur(name, data.getSprite(gl, "stage"));
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
        }
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.damage) {
            return null;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: this.index
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
}


export class Druaga extends EnemyData {
    private dir: number;
    private hitPoint = 96;
    private warpCount = 0;

    public constructor(sprite: SpriteData) {
        super("Druaga", sprite);
        this.dir = Math.floor(Math.random() * 4) + 1;
        this.damagePoint = 1;
    }

    public getHP(): number {
        return this.hitPoint;
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
        let bx = this.curX / BLOCK_SIZE;
        let by = this.curY / BLOCK_SIZE;
        let nextDir = (this.dir % 4) + 1;
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
        }
        for (let i = 0; i < 4; i++) {
            const add = getMoveAdd(nextDir);
            if (data.canMove(bx, by, add.ax, add.ay)) {
                break;
            } else if (this.curX === pos.x || this.curY === pos.y) {
                // ワープする
                this.dir = nextDir;
                this.warpCount = 64;
                return;
            }
            nextDir = (nextDir + 2) % 4 + 1;
        }
        if (this.dir === nextDir) {
            // 呪文チェック
            if (Math.random() < 0.3) {
                // 呪文
                new Spell(spellNameType[3], data.getSprite(gl, "Spell"), nextDir, this, data);
            }
        }
        const add = getMoveAdd(nextDir);
        this.dir = nextDir;
        this.nextX = this.curX + add.ax * BLOCK_SIZE;
        this.nextY = this.curY + add.ay * BLOCK_SIZE;
        this.moveCount = 24;
    }
    public getSpritePosition(): SpritePosition | null {
        if (this.warpCount & 2) {
            return null;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: (((this.curX + this.curY) & 8) >> 3)
        };
    }
    protected checkDamage(player: PlayerData): boolean {
        if (this.warpCount > 0) {
            return false;
        }
        return super.checkDamage(player);
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
     * @param index 0:イシター, 1:石, 2:カイ, 3:歩いているカイ
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
        }
    }
    public getSpritePosition(): SpritePosition | null {
        let ix = this.index;
        if (ix === 3) {
            ix = (this.curX & 8) > 0 ? 4 : 3;
        }
        return {
            x: this.curX / BLOCK_SIZE,
            y: this.curY / BLOCK_SIZE,
            index: ix
        };
    }

    protected onDead(data: StageData): void {
        data.setPlayMode(PlayMode.ZapWait);
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
    @EnemyEntry("Kai")
    public static kai(gl: WebGL2RenderingContext, data: StageData, name: string, num: number): void {
        const ene = new IshtarKai("Kai", data.getSprite(gl, 'Ishtar'), 1);
        ene.init(0, 4);
        data.addEnemy(ene);
    }
}

export class ItemEnemy extends EnemyData {
    public constructor(name: string, sprite: SpriteData, private index: number) {
        super(name, sprite);
    }
    protected nextMove(gl: WebGL2RenderingContext, data: StageData): void {
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
    switch (data.getTimer()) {
        case 60:
            Wisp.blue(gl, data, "BLUE_Wisp", 1);
            break;
        case 55:
            Wisp.red(gl, data, "RED_Wisp", 1);
            break;
        case 50:
            Wisp.blue8(gl, data, "BLUE_Wisp", 1);
            break;
        case 45:
            Wisp.red8(gl, data, "RED_Wisp", 1);
            break;
    }
});