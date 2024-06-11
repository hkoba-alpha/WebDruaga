import { Dragon, IshtarKai, ItemEnemy, Wisp } from "./Enemy";
import { BLOCK_SIZE, EnemyData, EventBase, EventData, EventEntry, EventResult, FLOOR_HEIGHT, FLOOR_WIDTH, HitRect, KEY_ITEM, MATTOCK_ITEM, NECKLACE_ITEM, ROD_ITEM, StageData } from "./StageData";

class DeadEvent extends EventBase {
    private target: string;
    private count: number;

    constructor(private event: string) {
        super();
        const dt = event.split('*');
        this.target = dt[0];
        this.count = parseInt(dt[1] || "1");
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (event.length > 0) {
            let cnt = this.getCount(event, "Dead", val => val === this.target);
            if (cnt > 0) {
                this.count -= cnt;
                if (this.count <= 0) {
                    // 特殊
                    return EventResult.OK;
                } else {
                    return EventResult.Next;
                }
            }
        }
        return EventResult.None;
    }

    @EventEntry("Dead")
    public static makeEvent(event: string): EventBase {
        return new DeadEvent(event);
    }
}

class BreakEvent extends EventBase {
    constructor(private count: number, private position: number[], private target: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let cnt = this.getCount(event, "Break", (pos) => {
            if (this.position.length > 0) {
                if (this.position[0] >= 0 && this.position[0] !== pos.x) {
                    return false;
                }
                if (this.position.length > 1) {
                    if (this.position[1] >= 0 && this.position[1] !== pos.y) {
                        return false;
                    }
                    if (this.position.length > 2) {
                        if (this.position[2] !== pos.dir) {
                            return false;
                        }
                    }
                }
            }
            if (this.target.length > 0) {
                return this.target.includes(pos.src)
            }
            return true;
        });
        if (cnt > 0) {
            this.count -= cnt;
            if (this.count <= 0) {
                return EventResult.OK;
            } else {
                return EventResult.Next;
            }
        }
        return EventResult.None;
    }

    @EventEntry("Break")
    public static makeEvent(count: string, ...opt: string[]): EventBase {
        let pos: number[] = [];
        let target: string[] = [];
        for (let v of opt) {
            let num = parseInt(v);
            if (isNaN(num)) {
                target.push(v);
            } else {
                pos.push(num);
            }
        }
        return new BreakEvent(parseInt(count), pos, target);
    }
}

class WalkDoorEvent extends EventBase {
    constructor(private enemy: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const pos = data.getDoorPos();
        const dx = pos.x * BLOCK_SIZE;
        const dy = pos.y * BLOCK_SIZE;
        if (this.enemy.length > 0) {
            for (let ene of data.getEnemyList()) {
                if (this.enemy.includes(ene.name)) {
                    const enepos = ene.getPosition();
                    if (enepos.x === dx && enepos.y === dy) {
                        return EventResult.OK;
                    }
                }
            }
            return EventResult.None;
        }
        let plpos = data.playerData.getPosition();
        if (plpos.x === dx && plpos.y === dy) {
            return EventResult.Hold;
        }
        return EventResult.None;
    }

    @EventEntry("WalkDoor")
    public static makeEvent(...enemy: string[]): EventBase {
        return new WalkDoorEvent(enemy);
    }
}
class WalkKeyEvent extends EventBase {
    constructor(private enemy: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const pos = data.getKeyPos();
        const dx = pos.x * BLOCK_SIZE;
        const dy = pos.y * BLOCK_SIZE;
        if (this.enemy.length > 0) {
            for (let ene of data.getEnemyList()) {
                if (this.enemy.includes(ene.name)) {
                    const enepos = ene.getPosition();
                    if (enepos.x === dx && enepos.y === dy) {
                        return EventResult.OK;
                    }
                }
            }
            return EventResult.None;
        }
        let plpos = data.playerData.getPosition();
        if (plpos.x === dx && plpos.y === dy) {
            return EventResult.OK;
        }
        if (data.playerData.hasItem(KEY_ITEM)) {
            return EventResult.NG;
        }
        return EventResult.None;
    }

    @EventEntry("WalkKey")
    public static makeEvent(...enemy: string[]): EventBase {
        return new WalkKeyEvent(enemy);
    }
}

class SpellEvent extends EventBase {
    /**
     * 
     * @param count 
     * @param options bsw 1:歩いているか, 2:剣をだしているか, 4:体で受けたか
     */
    constructor(private count: number, private options: number[], private srcList: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let flag = data.playerData.isWalk() ? 1 : 0;
        let cnt = this.getCount(event, "Spell", val => {
            if (val.type === 0) {
                // 呪文を出した
                return false;
            }
            let opt = -1;
            switch (val.type) {
                case 1:
                    // 盾
                    opt = flag;
                    break;
                case 2:
                    // 剣で盾
                    opt = flag | 2;
                    break;
                case 3:
                    // Body
                    opt = flag | 4;
                    if (data.playerData.getSwordIndex() !== 0) {
                        opt |= 2;
                    }
                    break;
            }
            if (this.options.length === 0 || this.options.includes(opt)) {
                if (this.srcList.length > 0) {
                    if (!this.srcList.includes(val.src)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        });
        if (cnt > 0) {
            this.count -= cnt;
            if (this.count <= 0) {
                this.count = 0;
                return EventResult.OK;
            } else {
                return EventResult.Next;
            }
        }
        return EventResult.None;
    }

    @EventEntry("Spell")
    static makeEvent(count: string, ...args: string[]): EventBase {
        let cnt = parseInt(count);
        let options: number[] = [];
        let srcList: string[] = [];
        for (let arg of args) {
            let v = parseInt(arg);
            if (isNaN(v)) {
                srcList.push(arg);
            } else {
                options.push(v);
            }
        }
        return new SpellEvent(cnt, options, srcList);
    }
}

/**
 * bx,by,dir,sword,flag
 */
class WalkPos extends EventBase {
    private lastPos?: {
        x: number;
        y: number;
    };
    /**
     * 
     * @param bx -1:任意
     * @param by -1:任意
     * @param dir 1:上, 2:右, 4:下, 8:左のフラグの組み合わせ
     * @param swordFlag 0:しまっている 1-3:剣を出しはじめ, 4:剣を出している, 5-7:しまいはじめ
     * @param flag 0:止まっている, 1:歩いている, 2:離れた瞬間
     */
    constructor(private bx: number, private by: number, private dir: number, private swordFlag: number, private flag: number) {
        super();
    }

    private isTarget(dir: number, swflag: number, x: number, y: number): boolean {
        if ((this.bx < 0 || this.bx * BLOCK_SIZE === x) && (this.by < 0 || this.by * BLOCK_SIZE === y)) {
            // 剣のチェック
            if (this.swordFlag >= 0 && this.swordFlag !== swflag) {
                return false;
            }
            // 方向のチェック
            let bit = (1 << (dir - 1));
            if (this.dir & bit) {
                return true;
            }
        }
        return false;
    }

    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const pos = data.playerData.getPosition();
        const dir = data.playerData.getDir();
        const swflag = data.playerData.getSwordIndex();
        if (this.flag === 2) {
            // 離れた瞬間
            if (this.lastPos && (this.lastPos.x !== pos.x || this.lastPos.y !== pos.y)) {
                // ここでチェックする
                if (this.isTarget(dir, swflag, this.lastPos.x, this.lastPos.y)) {
                    return EventResult.OK;
                }
            }
        } else {
            let chk = data.playerData.isWalk() ? 1 : 0;
            if ((this.flag < 0 || this.flag === chk) && this.isTarget(dir, swflag, pos.x, pos.y)) {
                return EventResult.OK;
            }
        }
        this.lastPos = pos;
        return EventResult.None;
    }

    @EventEntry("WalkPos")
    static makeEvent(...arg: string[]): EventBase {
        let param = [-1, -1, 15, -1, -1];
        for (let i = 0; i < arg.length; i++) {
            if (arg[i] !== '*') {
                param[i] = parseInt(arg[i]);
            }
        }
        return new WalkPos(param[0], param[1], param[2], param[3], param[4]);
    }
}

class EventOrder extends EventBase {
    private index: number;

    constructor(private eventList: EventBase[]) {
        super();
        this.index = 0;
    }
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        this.eventList.forEach(ev => ev.init(gl, data));
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const res = this.eventList[this.index].checkEvent(data, event);
        if (res === EventResult.NG || res === EventResult.Next) {
            return res;
        } else if (res === EventResult.OK || res === EventResult.Hold) {
            // 次へ
            this.index++;
            if (this.index < this.eventList.length) {
                return EventResult.Next;
            } else {
                // Repeat用
                this.index = 0;
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }

    @EventEntry("Order")
    static makeEvent(...arg: EventBase[]): EventBase {
        return new EventOrder(arg);
    }
}

class EventOr extends EventBase {
    constructor(private eventList: EventBase[]) {
        super();
    }
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        this.eventList.forEach(ev => ev.init(gl, data));
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let ret = EventResult.None;
        let hold = false;
        for (let i = 0; i < this.eventList.length; i++) {
            const res = this.eventList[i].checkEvent(data, event);
            if (res === EventResult.NG) {
                // 削除
                this.eventList.splice(i, 1);
                i--;
            } else if (res === EventResult.OK) {
                return EventResult.OK;
            } else if (res === EventResult.Next) {
                ret = res;
            } else if (res === EventResult.Hold) {
                hold = true;
            }
        }
        if (this.eventList.length === 0) {
            ret = EventResult.NG;
        }
        if (hold) {
            return EventResult.Hold;
        }
        return ret;
    }
    @EventEntry("Or")
    static makeEvent(...arg: EventBase[]): EventBase {
        return new EventOr(arg);
    }
}

class EventAnd extends EventBase {
    /**
     * 
     * @param eventList 
     * @param once 一度でも条件を満たしたらOKとする
     */
    constructor(private eventList: EventBase[], private once: boolean) {
        super();
    }
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        this.eventList.forEach(ev => ev.init(gl, data));
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let ret = EventResult.None;
        let flag = true;
        for (let i = 0; i < this.eventList.length; i++) {
            let res = this.eventList[i].checkEvent(data, event);
            if (res === EventResult.OK && !this.once) {
                res = EventResult.Hold;
            }
            if (res === EventResult.NG) {
                return res;
            } else if (res === EventResult.OK) {
                ret = EventResult.Next;
                this.eventList.splice(i, 1);
                i--;
            } else if (res === EventResult.Next) {
                ret = res;
                flag = false;
            } else if (res !== EventResult.Hold) {
                flag = false;
            }
        }
        if (flag) {
            //ret = this.eventList.length > 0 ? EventResult.Hold : EventResult.OK;
            ret = EventResult.OK;
        }
        return ret;
    }
    @EventEntry("And")
    static makeEvent(...arg: EventBase[]): EventBase {
        return new EventAnd(arg, true);
    }
    @EventEntry("SameTime")
    static makeSameTime(...arg: EventBase[]): EventBase {
        return new EventAnd(arg, false);
    }
}


class EventNot extends EventBase {
    constructor(private eventList: EventBase[]) {
        super();
    }
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        this.eventList.forEach(ev => ev.init(gl, data));
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // 全部 Hold なら None
        // OKがあったらNG
        // NGがあったらOKとして削除
        let hold = true;
        for (let i = 0; i < this.eventList.length; i++) {
            const res = this.eventList[i].checkEvent(data, event);
            if (res === EventResult.OK) {
                return EventResult.NG;
            } else if (res === EventResult.NG) {
                this.eventList.splice(i, 1);
                i--;
            }
            if (res !== EventResult.Hold) {
                hold = false;
            }
        }
        if (hold) {
            // すべてがHold
            return EventResult.None;
        } else if (this.eventList.length === 0) {
            return EventResult.OK;
        }
        return EventResult.Hold;
    }
    @EventEntry("Not")
    static makeEvent(...arg: EventBase[]): EventBase {
        return new EventNot(arg);
    }
}
/**
 * 一回だけOKとなる。それ以降はNG
 */
class EventOnce extends EventBase {
    constructor(private event?: EventBase) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (!this.event) {
            return EventResult.NG;
        }
        const ret = this.event.checkEvent(data, event);
        if (ret === EventResult.OK) {
            this.event = undefined;
        }
        return ret;
    }
    @EventEntry("Once")
    static makeEvent(event: EventBase): EventBase {
        return new EventOnce(event);
    }
}

class LostEvent extends EventBase {
    private mode = 0;
    constructor(private name: string) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (this.mode === 0) {
            if (data.playerData.hasItem(this.name)) {
                this.mode = 1;
                return EventResult.Next;
            } else {
                return EventResult.NG;
            }
        } else if (!data.playerData.hasItem(this.name)) {
            return EventResult.OK;
        }
        return EventResult.None;
    }

    @EventEntry("Lost")
    static makeEvent(name: string): EventBase {
        return new LostEvent(name);
    }
}

class GilMoveFloor8 extends EventBase {
    private initPos?: { x: number; y: number; };
    public constructor() {
        super();
    }
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        this.initPos = data.playerData.getPosition();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const ix = data.playerData.getSwordIndex();
        if (ix > 0 && ix < 4) {
            const pos = data.playerData.getPosition();
            if (pos.x !== this.initPos!.x && pos.y !== this.initPos!.y) {
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }
}
/**
 * 歩いていない状態で
 */
class GilMoveFloor18 extends EventBase {
    private count = 3;

    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let pos = data.playerData.getPosition();
        if (pos.x === 0 || pos.x === (FLOOR_WIDTH - 1) * BLOCK_SIZE || pos.y === 0 || pos.y === (FLOOR_HEIGHT - 1) * BLOCK_SIZE) {
            return EventResult.None;
        } else if (data.getGlobalCount() === 0) {
            this.count--;
            if (this.count > 0) {
                return EventResult.Next;
            } else {
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }
}
class GilMoveFloor24 extends EventBase {
    /**
     * スタート地点で剣を振る
     * @param data 
     * @param event 
     */
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const stpos = data.getTreasurePos();
        const pos = data.playerData.getPosition();
        if (pos.x === stpos.x * BLOCK_SIZE && pos.y === stpos.y * BLOCK_SIZE && data.playerData.getSwordMode() === 2) {
            // 閉じ始めている
            if (data.playerData.getSwordIndex() === 4) {
                // 
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }
}
class GilMoveFloor30 extends EventBase {
    private index: number = 0;

    /**
     * 指定位置を通った後、x,yもずれてを３回繰り返す
     * @param data 
     * @param event 
     */
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const pos = data.playerData.getPosition();
        let xflag = (pos.x & 255) === 56;
        let yflag = pos.y === 24;
        if (this.index & 1) {
            if (!xflag && !yflag) {
                this.index++;
                if (this.index >= 6) {
                    return EventResult.OK;
                }
                return EventResult.Next;
            }
        } else if (xflag && yflag) {
            this.index++;
        }
        return EventResult.None;
    }
}
class GilMoveFloor32 extends EventBase {
    private lastSword: number = 0;

    /**
     * 剣を連続で振る
     * @param data 
     * @param event 
     */
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let sw = data.playerData.getSwordIndex();
        if (sw === 1 && this.lastSword === 7) {
            return EventResult.OK;
        }
        this.lastSword = sw;
        return EventResult.None;
    }
}
class GilMoveFloor46 extends EventBase {
    private cornerFlag: number = 0;
    private firstDir: number = 0;

    /**
     * 外周に触れる、４つの角を通る、最初の外周に触れる
     * @param data 
     * @param event 
     */
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // レッドネックレスがないとだめ
        if (!data.playerData.hasItem(NECKLACE_ITEM + ':2')) {
            return EventResult.NG;
        }
        const pos = data.playerData.getPosition();
        if (this.firstDir === 0 || this.cornerFlag === 15) {
            let out = false;
            if (pos.x === 0) {
                if (data.playerData.isWalk() && data.playerData.getDir() === 4) {
                    out = true;
                }
            }
            if (pos.x === (FLOOR_WIDTH - 1) * BLOCK_SIZE) {
                if (data.playerData.isWalk() && data.playerData.getDir() === 2) {
                    out = true;
                }
            }
            if (pos.y === 0) {
                if (data.playerData.isWalk() && data.playerData.getDir() === 1) {
                    out = true;
                }
            }
            if (pos.y === (FLOOR_HEIGHT - 1) * BLOCK_SIZE) {
                if (data.playerData.isWalk() && data.playerData.getDir() === 3) {
                    out = true;
                }
            }
            if (out) {
                if (this.firstDir === 0) {
                    this.firstDir = data.playerData.getDir();
                    return EventResult.Next;
                } else if (this.firstDir === data.playerData.getDir()) {
                    return EventResult.OK;
                }
            }
        } else {
            // コーナー
            if (pos.x === 0 && pos.y === 0) {
                if ((this.cornerFlag & 1) === 0) {
                    this.cornerFlag |= 1;
                    return EventResult.Next;
                }
            } else if (pos.x === (FLOOR_WIDTH - 1) * BLOCK_SIZE && pos.y === 0) {
                if ((this.cornerFlag & 2) === 0) {
                    this.cornerFlag |= 2;
                    return EventResult.Next;
                }
            } else if (pos.x === 0 && pos.y === (FLOOR_HEIGHT - 1) * BLOCK_SIZE) {
                if ((this.cornerFlag & 4) === 0) {
                    this.cornerFlag |= 4;
                    return EventResult.Next;
                }
            } else if (pos.x === (FLOOR_WIDTH - 1) * BLOCK_SIZE && pos.y === (FLOOR_HEIGHT - 1) * BLOCK_SIZE) {
                if ((this.cornerFlag & 8) === 0) {
                    this.cornerFlag |= 8;
                    return EventResult.Next;
                }
            }
        }
        return EventResult.None;
    }
}
class GilMoveFloor50 extends EventBase {
    private outFlag: number = 0;

    /**
     * ４つの外周に触れる
     * @param data 
     * @param event 
     */
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const pos = data.playerData.getPosition();

        let out = false;
        if (pos.x === 0) {
            if (data.playerData.isWalk() && data.playerData.getDir() === 4) {
                out = true;
            }
        }
        if (pos.x === (FLOOR_WIDTH - 1) * BLOCK_SIZE) {
            if (data.playerData.isWalk() && data.playerData.getDir() === 2) {
                out = true;
            }
        }
        if (pos.y === 0) {
            if (data.playerData.isWalk() && data.playerData.getDir() === 1) {
                out = true;
            }
        }
        if (pos.y === (FLOOR_HEIGHT - 1) * BLOCK_SIZE) {
            if (data.playerData.isWalk() && data.playerData.getDir() === 3) {
                out = true;
            }
        }
        if (out) {
            let flag = (1 << (data.playerData.getDir() - 1));
            if ((this.outFlag & flag) === 0) {
                this.outFlag |= flag;
                if (this.outFlag === 15) {
                    return EventResult.OK;
                } else {
                    return EventResult.Next;
                }
            }
        }
        return EventResult.None;
    }
}
class GilMoveFloor51 extends EventBase {
    private pushCount = 0;

    /**
     * キーをニュートラルじゃない状態を512int入れ続ける
     * @param data 
     * @param event 
     */
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let flag = data.playerData.stick.isLeft()
            || data.playerData.stick.isRight()
            || data.playerData.stick.isUp()
            || data.playerData.stick.isDown();
        if (flag) {
            this.pushCount++;
            if (this.pushCount >= 512) {
                return EventResult.OK;
            }
        } else {
            this.pushCount = 0;
        }
        return EventResult.None;
    }
}
class GilMoveFamUra4 extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (data.playerData.getSwordIndex() === 4) {
            const doorpos = data.getDoorPos();
            const pos = data.playerData.getPosition();
            const dir = data.playerData.getDir();
            if (doorpos.y * BLOCK_SIZE === pos.y) {
                if (pos.x < doorpos.x * BLOCK_SIZE && dir === 2) {
                    return EventResult.OK;
                } else if (pos.x > doorpos.x * BLOCK_SIZE && dir === 4) {
                    return EventResult.OK;
                }
            }
            if (doorpos.x * BLOCK_SIZE === pos.x) {
                if (pos.y > doorpos.y * BLOCK_SIZE && dir === 1) {
                    return EventResult.OK;
                }
            }

        }
        return EventResult.None;
    }
}
class GilMoveFamUra25 extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // タイムが赤くなる時に扉と軸を合わせて剣を出している
        if (data.isRedTime()) {
            // チェックする
            if (data.playerData.getSwordIndex() === 4) {
                const pos = data.playerData.getPosition();
                const pos2 = data.getDoorPos();
                if (pos.x === pos2.x * BLOCK_SIZE || pos.y === pos2.y * BLOCK_SIZE) {
                    return EventResult.OK;
                }
            }
            return EventResult.NG;
        }
        return EventResult.None;
    }
}
class GilMoveFamUra31 extends EventBase {
    private count = 0;
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (!data.playerData.isWalk() && data.playerData.getSwordIndex() === 4) {
            const pos = data.playerData.getPosition();
            if ((pos.x % BLOCK_SIZE) > 0 || (pos.y % BLOCK_SIZE) > 0) {
                this.count++;
                if (this.count % 60 === 0) {
                    if (this.count >= 600) {
                        return EventResult.OK;
                    }
                    return EventResult.Next;
                }
            } else {
                this.count = 0;
            }
        } else {
            this.count = 0;
        }
        return EventResult.None;
    }
}
class GilMoveFamUra45 extends EventBase {
    private count = 0;
    private lastDistance = 0;
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // チョン、チョンと方向キーを押しながら鍵を取る
        if (data.playerData.getItem(KEY_ITEM) > 0) {
            return this.count > 8 ? EventResult.OK : EventResult.NG;
        } else {
            const pos = data.playerData.getPosition();
            const pos2 = data.getKeyPos();
            const dist = Math.max(Math.abs(pos.x - pos2.x * BLOCK_SIZE), Math.abs(pos.y - pos2.y * BLOCK_SIZE));
            if (dist < BLOCK_SIZE) {
                // 鍵の近く
                if (dist > this.lastDistance) {
                    this.count = 0;
                } else {
                    if (this.count & 1) {
                        if (!data.playerData.isWalk()) {
                            // 離す
                            this.count++;
                        }
                    } else if (data.playerData.isWalk()) {
                        // 押して近づく
                        this.count++;
                    }
                }
            } else {
                this.count = 0;
            }
            this.lastDistance = dist;
        }
        return EventResult.None;
    }
}
class GilMovePsUra14 extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // スタートから横に９ブロック以上離れて剣をしまう動作
        const pos2 = data.getTreasurePos();
        const pos = data.playerData.getPosition();
        if (Math.abs(pos.x - pos2.x * BLOCK_SIZE) >= 9 * BLOCK_SIZE) {
            if (data.playerData.getSwordIndex() === 7) {
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }
}
class GilMovePsUra24 extends EventBase {
    private keyDir = 0;
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (this.keyDir === 0) {
            if (data.playerData.hasItem(KEY_ITEM)) {
                this.keyDir = data.playerData.getDir();
                const pos = data.getDoorPos();
                switch (this.keyDir) {
                    case 1:
                        if (pos.y >= FLOOR_HEIGHT - 1) {
                            return EventResult.NG;
                        }
                        break;
                    case 2:
                        if (pos.x <= 0) {
                            return EventResult.NG;
                        }
                        break;
                    case 3:
                        if (pos.y <= 0) {
                            return EventResult.NG;
                        }
                        break;
                    case 4:
                        if (pos.x >= FLOOR_WIDTH - 1) {
                            return EventResult.NG;
                        }
                        break;
                }
                return EventResult.Next;
            }
        } else if (data.isDoorOpen()) {
            if (data.playerData.getDir() === this.keyDir) {
                return EventResult.OK;
            } else {
                return EventResult.NG;
            }
        }
        return EventResult.None;
    }
}
class GilMovePsUra29 extends EventBase {
    private mode = 0;
    private count = 0;
    private nextDir = 0;
    private lastPoint: { x: number; y: number; } = { x: -1, y: -1 };

    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // マトックを無くした状態で中央の柱を右回りに最短で３回回る
        // (8,4)-(9,5)
        let ret = EventResult.None;
        if (this.mode === 0) {
            if (!data.playerData.hasItem(MATTOCK_ITEM)) {
                this.mode = 1;
                ret = EventResult.Next;
            }
        } else {
            const pos = data.playerData.getPosition();
            if (pos.x !== this.lastPoint.x || pos.y !== this.lastPoint.y) {
                this.lastPoint = pos;
                if (pos.x % BLOCK_SIZE === 0 && pos.y % BLOCK_SIZE === 0) {
                    // チェックする
                    if (pos.x / BLOCK_SIZE === 8) {
                        if (pos.y / BLOCK_SIZE === 4) {
                            this.nextDir = 2;
                            this.count++;
                            ret = EventResult.Next;
                        } else if (pos.y / BLOCK_SIZE === 5) {
                            this.nextDir = 1;
                            this.count++;
                            ret = EventResult.Next;
                        } else {
                            this.nextDir = 0;
                            this.count = 0;
                        }
                    } else if (pos.x / BLOCK_SIZE === 9) {
                        if (pos.y / BLOCK_SIZE === 4) {
                            this.nextDir = 3;
                            this.count++;
                            ret = EventResult.Next;
                        } else if (pos.y / BLOCK_SIZE === 5) {
                            this.nextDir = 4;
                            this.count++;
                            ret = EventResult.Next;
                        } else {
                            this.nextDir = 0;
                            this.count = 0;
                        }
                    } else {
                        this.nextDir = 0;
                        this.count = 0;
                    }
                    if (this.count > 12) {
                        // ３周した
                        ret = EventResult.OK;
                    }
                } else {
                    // 決められた方向だけ
                    if (data.playerData.getDir() !== this.nextDir) {
                        this.count = 0;
                        this.nextDir = 0;
                    }
                }
            }
        }
        return ret;
    }
}
class GilMovePsUra41 extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // 開始位置の縦の壁をすべて壊す
        const tpos = data.getTreasurePos();
        let cnt = this.getCount(event, 'Break', pos => {
            if (pos.x === tpos.x && (pos.dir === 1 || pos.dir === 3)) {
                return true;
            }
            return false;
        });
        if (cnt > 0) {
            let ret = EventResult.OK;
            for (let y = 0; y < FLOOR_HEIGHT - 1; y++) {
                if (!data.canMove(tpos.x, y, 0, 1)) {
                    ret = EventResult.Next;
                    break;
                }
            }
            return ret;
        }
        return EventResult.None;
    }
}
class GilMovePsUra51 extends EventBase {
    private count = 0;
    private lastPos: { x: number; y: number; } = { x: 0, y: 0 };
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        this.lastPos = data.playerData.getPosition();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // 壁に当たらず剣ボタンを押し続けたまま255ドット移動する
        if (data.playerData.getSwordMode() === 1) {
            if (data.playerData.isWalk()) {
                const pos = data.playerData.getPosition();
                if (pos.x === this.lastPos.x && pos.y === this.lastPos.y) {
                    // 失敗
                    this.count = 0;
                } else {
                    this.count++;
                    if (this.count >= 255) {
                        return EventResult.OK;
                    } else if (this.count % 60 === 0) {
                        return EventResult.Next;
                    }
                }
                this.lastPos = pos;
            }
        } else {
            this.count = 0;
        }
        return EventResult.None;
    }
}
class GilMovePsUra56 extends EventBase {
    /**
     * 0: 全滅前, 1:全滅後
     */
    private mode = 0;
    private count = 0;
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (this.mode === 0) {
            const cnt = this.getCount(event, 'Break', pos => pos.src !== 'Gil');
            this.count += cnt;
            const cnt2 = this.getCount(event, 'Dead', v => true);
            if (cnt2 > 0) {
                // Wisp以外がいるかどうか
                for (let ene of data.getEnemyList()) {
                    if (!(ene instanceof Wisp)) {
                        return EventResult.Next;
                    }
                }
                // いなくなった
                this.mode = 1;
            }
        } else {
            const cnt = this.getCount(event, 'Break', pos => pos.src === 'Gil');
            this.count -= cnt;
            if (this.count < 0) {
                return EventResult.OK;
            } else if (cnt > 0) {
                return EventResult.Next;
            }
        }
        return EventResult.None;
    }
}
class GilMoveYami84 extends EventBase {
    // ,
    private count = 0;
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // スタート地点で剣を２回振る
        // 連続で振ると出ない
        const stpos = data.getTreasurePos();
        const pos = data.playerData.getPosition();
        if (stpos.x * BLOCK_SIZE === pos.x && stpos.y * BLOCK_SIZE === pos.y) {
            if (data.playerData.getSwordIndex() > 0) {
                if (data.playerData.getSwordIndex() === 1) {
                    this.count |= 1;
                }
            } else if (this.count & 1) {
                this.count++;
                if (this.count >= 4) {
                    return EventResult.OK;
                } else {
                    return EventResult.Next;
                }
            }
        } else {
            this.count = 0;
        }
        return EventResult.None;
    }
}
class GilMoveYami99 extends EventBase {
    private lastCount = -1;
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // 扉の縦横すべての壁を壊す
        const pos = data.getDoorPos();
        let cnt = 0;
        for (let x = 0; x < FLOOR_WIDTH - 1; x++) {
            if (!data.canMove(x, pos.y, 1, 0)) {
                cnt++;
            }
        }
        for (let y = 0; y < FLOOR_HEIGHT - 1; y++) {
            if (!data.canMove(pos.x, y, 0, 1)) {
                cnt++;
            }
        }
        if (cnt === 0) {
            return EventResult.OK;
        }
        if (!data.playerData.hasItem(MATTOCK_ITEM)) {
            return EventResult.NG;
        }
        if (this.lastCount < 0) {
            this.lastCount = cnt;
        } else if (cnt < this.lastCount) {
            this.lastCount = cnt;
            return EventResult.Next;
        }
        return EventResult.None;
    }
}

class GilMove {
    @EventEntry("GilMove")
    static gilMoveEvent(name: string): EventBase {
        if (name === "Floor8") {
            return new GilMoveFloor8();
        } else if (name === "Floor18") {
            return new GilMoveFloor18();
        } else if (name === "Floor24") {
            return new GilMoveFloor24();
        } else if (name === "Floor30") {
            return new GilMoveFloor30();
        } else if (name === "Floor32") {
            return new GilMoveFloor32();
        } else if (name === "Floor46") {
            return new GilMoveFloor46();
        } else if (name === "Floor50") {
            return new GilMoveFloor50();
        } else if (name === "Floor51") {
            return new GilMoveFloor51();
        } else if (name === "FamUra4") {
            return new GilMoveFamUra4();
        } else if (name === "FamUra25") {
            return new GilMoveFamUra25();
        } else if (name === "FamUra31") {
            return new GilMoveFamUra31();
        } else if (name === "FamUra45") {
            return new GilMoveFamUra45();
        } else if (name === "PsUra14") {
            return new GilMovePsUra14();
        } else if (name === "PsUra24") {
            return new GilMovePsUra24();
        } else if (name === "PsUra29") {
            return new GilMovePsUra29();
        } else if (name === "PsUra41") {
            return new GilMovePsUra41();
        } else if (name === "PsUra51") {
            return new GilMovePsUra51();
        } else if (name === "PsUra56") {
            return new GilMovePsUra56();
        } else if (name === "Yami84") {
            return new GilMoveYami84();
        } else if (name === "Yami99") {
            return new GilMoveYami99();
        } else {
            console.log("Unkown GilMove", name);
        }
        // Error
        let ng = class extends EventBase {
            public checkEvent(data: StageData, event: EventData[]): EventResult {
                return EventResult.NG;
            }
        };
        return new ng();
    }
}

class EnemyMoveFloor12 extends EventBase {
    public constructor() {
        super();
    }

    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // ドルイドを最下段に出現させる
        for (let ene of data.getEnemyList()) {
            if (ene.name === "DLUID") {
                if (ene.getPosition().y === (FLOOR_HEIGHT - 1) * BLOCK_SIZE) {
                    return EventResult.OK;
                }
            }
        }
        return EventResult.None;
    }

}
class EnemyMoveFamUra5 extends EventBase {
    private countMap: { [key: string]: number } = {};
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // 同じ位置で止まったまま呪文を５回受ける
        if (!data.playerData.isWalk()) {
            let cnt = this.getCount(event, "Spell", v => v.type > 0);
            if (cnt > 0) {
                const pos = data.playerData.getPosition();
                const key = pos.x + "," + pos.y;
                this.countMap[key] = (this.countMap[key] || 0) + cnt;
                if (this.countMap[key] >= 5) {
                    return EventResult.OK;
                }
                return EventResult.Next;
            }
        }
        return EventResult.None;
    }
}
class EnemyMoveFamUra19 extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        for (let dt of data.getFireList()) {
            if (dt.length >= 5) {
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }
}
class EnemyMoveFamUra32 extends EventBase {
    private lastDir = 0;

    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // クオックスが下向きの時に倒す
        let cnt = this.getCount(event, 'Dead', v => v === 'QUOX_Dragon');
        if (cnt > 0) {
            if (this.lastDir === 3) {
                return EventResult.OK;
            } else {
                return EventResult.NG;
            }
        } else {
            for (let ene of data.getEnemyList()) {
                if (ene instanceof Dragon) {
                    this.lastDir = (ene as Dragon).getDir();
                    break;
                }
            }
        }
        return EventResult.None;
    }
}
class EnemyMovePsUra19 extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let pos: { x: number; y: number } | undefined;
        let wiz: { x: number; y: number }[] = [];
        let wizcnt = 0;
        for (let ene of data.getEnemyList()) {
            if (ene.name === 'QUOX_Dragon') {
                pos = ene.getPosition();
            } else if (ene.name === 'WIZARD') {
                wizcnt++;
            } else if (ene.name === 'WIZARD_Spell') {
                wiz.push(ene.getPosition());
            }
        }
        if (!pos || wizcnt === 0) {
            return EventResult.NG;
        }
        for (let p of wiz) {
            if (Math.abs(p.x - pos.x) < 12 && Math.abs(p.y - pos.y) < 12) {
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }
}
class EnemyMovePsUra21 extends EventBase {
    private wisp: {
        enemy: Wisp;
        last: {
            bx: number;
            by: number;
            turnCount: number;
            count: number;
        };
    }[] = [];
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        for (let ene of data.getEnemyList()) {
            if (ene instanceof Wisp) {
                this.wisp.push({
                    enemy: ene,
                    last: {
                        bx: -1,
                        by: -1,
                        turnCount: -1,
                        count: 0
                    }
                });
            }
        }
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // ウィスプが、３回連続同じ柱を回る
        let ret = EventResult.None;
        for (let dt of this.wisp) {
            if (dt.enemy.turnCount > dt.last.turnCount && dt.enemy.lastTurn) {
                // 回転した
                if (dt.last.bx === dt.enemy.lastTurn.bx && dt.last.by === dt.enemy.lastTurn.by) {
                    dt.last.count++;
                    if (dt.last.count >= 3) {
                        ret = EventResult.OK;
                        break;
                    } else {
                        ret = EventResult.Next;
                    }
                } else {
                    dt.last.count = 0;
                }
                dt.last.bx = dt.enemy.lastTurn.bx;
                dt.last.by = dt.enemy.lastTurn.by;
                dt.last.turnCount = dt.enemy.turnCount;
            }
        }
        return ret;
    }
}
class EnemyMoveYami72 extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let count = 0;
        for (let ene of data.getEnemyList()) {
            if (ene.name === 'DLUID' || ene.name === 'MAGE_Ghost') {
                count++;
                if (ene.getPosition().x === 0) {
                    return EventResult.OK;
                }
            }
        }
        if (count === 0) {
            return EventResult.NG;
        }
        return EventResult.None;
    }
}
class EnemyMoveYami98 extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        // シルバードラゴンとブラックドラゴンを重ねる
        let pos: { x: number; y: number }[] = [];
        for (let ene of data.getEnemyList()) {
            if (ene instanceof Dragon) {
                pos.push(ene.getPosition());
            }
        }
        if (pos.length < 2) {
            return EventResult.NG;
        } else {
            if (Math.abs(pos[0].x - pos[1].x) < 14 && Math.abs(pos[0].y - pos[1].y) < 14) {
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }

}

class EnemyMove {
    @EventEntry("EnemyMove")
    static enemyMoveEvent(name: string): EventBase {
        if (name === "Floor12") {
            return new EnemyMoveFloor12();
        } else if (name === "FamUra5") {
            return new EnemyMoveFamUra5();
        } else if (name === "FamUra19") {
            return new EnemyMoveFamUra19();
        } else if (name === "FamUra32") {
            return new EnemyMoveFamUra32();
        } else if (name === "PsUra19") {
            return new EnemyMovePsUra19();
        } else if (name === "PsUra21") {
            return new EnemyMovePsUra21();
        } else if (name === "Yami72") {
            return new EnemyMoveYami72();
        } else if (name === "Yami98") {
            return new EnemyMoveYami98();
        } else {
            console.log("Unknown EnemyMove", name);
        }
        // Error
        let ng = class extends EventBase {
            public checkEvent(data: StageData, event: EventData[]): EventResult {
                return EventResult.NG;
            }
        };
        return new ng();
    }
}

class EneCount extends EventBase {
    private lastCount = -1;
    constructor(private count: number, private nameList: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let cnt = 0;
        for (let ene of data.getEnemyList()) {
            if (this.nameList.includes(ene.name)) {
                cnt++;
            }
        }
        let ret = EventResult.None;
        if (this.count === cnt) {
            ret = EventResult.OK;
        } else if (this.lastCount !== cnt) {
            if (this.lastCount > 0 && Math.abs(this.lastCount - this.count) > Math.abs(cnt - this.count)) {
                ret = EventResult.Next;
            }
            this.lastCount = cnt;
        }
        return ret;
    }

    @EventEntry("EneCount")
    static makeEvent(count: string, ...name: string[]): EventBase {
        return new EneCount(parseInt(count), name);
    }
}

/**
 * 一定時間条件を満たし続ける
 */
class ContEvent extends EventBase {
    private count: number = 0;
    constructor(private timeCount: number, private eventList: EventBase[], private reset: boolean) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let ok = true;
        for (let ev of this.eventList) {
            const res = ev.checkEvent(data, event);
            if (res === EventResult.NG) {
                return res;
            } else if (res !== EventResult.OK && res !== EventResult.Hold) {
                ok = false;
                break;
            }
        }
        if (ok) {
            this.count++;
            if (this.count >= this.timeCount) {
                return EventResult.OK;
            } else if (this.count % 60 === 0) {
                return EventResult.Next;
            }
        } else if (this.reset) {
            this.count = 0;
        }
        return EventResult.None;
    }
    @EventEntry("Cont")
    static makeEvent(count: string, ...list: EventBase[]): EventBase {
        return new ContEvent(parseInt(count), list, true);
    }
    @EventEntry("Total")
    static makeTotalEvent(count: string, ...list: EventBase[]): EventBase {
        return new ContEvent(parseInt(count), list, false);
    }
}
class RepeatEvent extends EventBase {
    private count = 0;

    constructor(private repeatCount: number, private event: EventBase) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const ret = this.event.checkEvent(data, event);
        if (ret === EventResult.NG) {
            return ret;
        } else if (ret === EventResult.OK || ret === EventResult.Hold) {
            this.count++;
            if (this.count >= this.repeatCount) {
                this.count = 0;
                return EventResult.OK;
            } else {
                return EventResult.Next;
            }
        }
        return EventResult.None;
    }
    @EventEntry("Repeat")
    static makeEvent(count: string, event: EventBase): EventBase {
        return new RepeatEvent(parseInt(count), event);
    }
}

class DummyItem extends EventAnd {
    constructor(eventList: EventBase[]) {
        super(eventList, true);
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let ret = super.checkEvent(data, event);
        if (ret) {
            // 
        }
        return ret;
    }
    @EventEntry("DummyItem")
    static makeEvent(...list: EventBase[]): EventBase {
        return new DummyItem(list);
    }
}

class RestTime extends EventBase {
    constructor(private time: number) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (this.time <= 60) {
            if (data.isRedTime()) {
                if (data.getTimer() <= this.time) {
                    return EventResult.OK;
                }
            }
        } else if (data.getTimer() <= this.time) {
            return EventResult.OK;
        }
        return EventResult.None;
    }

    @EventEntry("RestTime")
    static makeEvent(time: string): EventBase {
        return new RestTime(parseInt(time));
    }
}

/**
 * 
 */
class SamePos extends EventBase {
    constructor(private target: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const plpos = data.playerData.getPosition();
        for (let ene of data.getEnemyList()) {
            if (this.target.includes(ene.name)) {
                const pos = ene.getPosition();
                if (plpos.x === pos.x && plpos.y === pos.y) {
                    return EventResult.OK;
                }
            }
        }
        return EventResult.None;
    }

    @EventEntry("SamePos")
    static makeEvent(...target: string[]): EventBase {
        return new SamePos(target);
    }
}

class WarpEvent extends EventBase {
    constructor(private count: number) {
        super();
    }

    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let cnt = this.getCount(event, "Warp", () => true);
        if (cnt > 0) {
            this.count -= cnt;
            if (this.count <= 0) {
                return EventResult.OK;
            } else {
                return EventResult.Next;
            }
        }
        return EventResult.None;
    }

    @EventEntry("Warp")
    static makeEvent(count: string): EventBase {
        return new WarpEvent(parseInt(count));
    }
}

class HasItem extends EventBase {
    constructor(private item: string) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (data.playerData.hasItem(this.item)) {
            // EVILは無効
            if (this.item === ROD_ITEM + ':4' && data.playerData.isEvil(ROD_ITEM)) {
                return EventResult.NG;
            }
            return EventResult.OK;
        } else {
            return EventResult.NG;
        }
    }
    @EventEntry("HasItem")
    static makeEvent(item: string): EventBase {
        return new HasItem(item);
    }
}

class CoundDown extends EventBase {
    private count: number = 0;

    constructor(private countTarget: number) {
        super();
    }

    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (this.countTarget > 0) {
            this.count++;
            if (this.count >= this.countTarget) {
                return EventResult.OK;
            }
        } else if (data.playerData.isWalk() || data.playerData.getSwordIndex() % 4) {
            this.count = 0;
        } else {
            this.count--;
            if (this.count <= this.countTarget) {
                return EventResult.OK;
            }
        }
        return Event.NONE;
    }
    @EventEntry("CountDown")
    static makeEvent(count: string): EventBase {
        return new CoundDown(parseInt(count));
    }
}

class OpenEvent extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (data.isDoorOpen()) {
            return EventResult.OK;
        }
        return EventResult.None;
    }
    @EventEntry("Open")
    static makeEvent(): EventBase {
        return new OpenEvent();
    }
}

class StickEvent extends EventBase {
    private index: number = 0;
    private neutral = false;

    constructor(private stick: string) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let stk = 0;
        if (data.playerData.stick.isUp()) {
            stk = 1;
        } else if (data.playerData.stick.isRight()) {
            stk = 2;
        } else if (data.playerData.stick.isDown()) {
            stk = 3;
        } else if (data.playerData.stick.isLeft()) {
            stk = 4;
        } else if (data.playerData.stick.isPause()) {
            stk = 5;
        } else if (data.playerData.stick.isSelect()) {
            stk = 6;
        }
        if (stk === 0) {
            this.neutral = true;
            return EventResult.None;
        }
        if (this.neutral) {
            let target = "*URDL12".indexOf(this.stick.charAt(this.index));
            this.neutral = false;
            if (target === stk) {
                this.index++;
                if (this.index < this.stick.length) {
                    return EventResult.Next;
                } else {
                    // SameTimeを考慮して元に戻す
                    this.index = 0;
                    return EventResult.OK;
                }
            } else {
                // 最初から
                this.index = 0;
            }
        }
        return EventResult.None;
    }
    @EventEntry("Stick")
    static makeEvent(stick: string): EventBase {
        return new StickEvent(stick);
    }
}
class EnemyEvent extends EventBase {
    constructor(private enemy: string, private options: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        let ret = EventResult.NG;
        for (let ene of data.getEnemyList()) {
            if (ene.name === this.enemy) {
                ene.onEvent(data, this.options);
                ret = EventResult.OK;
            }
        }
        return ret;
    }

    @EventEntry("EnemyEvent")
    static makeEvent(enemy: string, ...options: string[]): EventBase {
        return new EnemyEvent(enemy, options);
    }
}
class KeyGet extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (data.playerData.getItem(KEY_ITEM) > 0) {
            return EventResult.OK;
        }
        return EventResult.None;
    }

    @EventEntry("KeyGet")
    static makeEvent(): EventBase {
        return new KeyGet();
    }
}

/**
 * 最終フロアのイベント
 * i:イシターを取得
 * G:グリーンクリスタルロッドを左に置く
 * g:グリーンクリスタルロッドをその場に置く
 * R:
 * r:
 * B:
 * b:
 * s:カイを石から戻す
 * S:カイを石から偽物の戻す
 * k:カイを取る（歩いて動き出す）
 * K:カイをその場に置く
 * 0:ロッドをアイテムに戻す
 * X:レッドとグリーンのクリスタルロッドが左に集まる
 */
class LastFloor extends EventBase {
    private index = 0;
    private gl?: WebGL2RenderingContext;

    constructor(private action: string[], private eventList: EventBase[]) {
        super();
    }
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        this.gl = gl;
        this.eventList.forEach(ev => ev.init(gl, data));
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const res = this.eventList[this.index].checkEvent(data, event);
        if (res === EventResult.NG) {
            return res;
        } else if (res === EventResult.OK || res === EventResult.Hold) {
            // OK
            this.doAction(data, this.action[this.index]);
            this.index++;
            if (this.index < this.eventList.length) {
                return EventResult.Next;
            } else {
                return EventResult.OK;
            }
        }
        return EventResult.None;
    }
    private getEnemy<T extends EnemyData>(name: string, data: StageData): T | null {
        for (let ene of data.getEnemyList()) {
            if (ene.name === name) {
                return ene as T;
            }
        }
        return null;
    }
    private putRod(data: StageData, item: string, bx: number, by: number): void {
        const ene = new ItemEnemy(item, data.getSprite(this.gl!, 'Rod'), "124".indexOf(item.split(':')[1]));
        ene.init(bx, by);
        data.addEnemy(ene);
        data.playerData.lostItem(item);
    }
    private doAction(data: StageData, act: string): void {
        if (!act) {
            // clear
            return;
        }
        const pos = data.playerData.getPosition();
        let px = Math.round(pos.x / BLOCK_SIZE);
        let py = Math.round(pos.y / BLOCK_SIZE);
        for (let i = 0; i < act.length; i++) {
            switch (act.charAt(i)) {
                case 'i':
                    {
                        const ishtar = this.getEnemy<IshtarKai>('Ishtar', data);
                        if (ishtar) {
                            data.removeEnemy(ishtar);
                        }
                    }
                    break;
                case 'G':
                    this.putRod(data, 'ROD:1', px - 1, py);
                    break;
                case 'g':
                    this.putRod(data, 'ROD:1', px, py);
                    break;
                case 'R':
                    this.putRod(data, 'ROD:2', px - 1, py);
                    break;
                case 'r':
                    this.putRod(data, 'ROD:2', px, py);
                    break;
                case 'B':
                    this.putRod(data, 'ROD:4', px - 1, py);
                    break;
                case 'b':
                    this.putRod(data, 'ROD:4', px, py);
                    break;
                case 's':
                case 'S':
                case 'K':
                    {
                        const kai = this.getEnemy<IshtarKai>('Kai', data);
                        if (kai) {
                            kai.setIndex(2);
                        }
                    }
                    break;
                case 'k':
                    {
                        const kai = this.getEnemy<IshtarKai>('Kai', data);
                        if (kai) {
                            kai.setIndex(3);
                        }
                    }
                    break;
                case 'X':
                    {
                        // アイテムが移動する
                        const pos = data.playerData.getPosition();
                        const nx = Math.round(pos.x / BLOCK_SIZE) * BLOCK_SIZE - BLOCK_SIZE;
                        const ny = Math.round(pos.y / BLOCK_SIZE) * BLOCK_SIZE;
                        for (let ene of data.getEnemyList()) {
                            if (ene instanceof ItemEnemy) {
                                const old = ene.getPosition();
                                ene.moveTo(nx, ny, Math.max(Math.abs(nx - old.x), Math.abs(ny - old.y)) / 2);
                            }
                        }
                    }
                    break;
                case '0':
                    {
                        // アイテムにする
                        for (let ene of data.getEnemyList()) {
                            if (ene instanceof ItemEnemy) {
                                const item = ene as ItemEnemy;
                                item.setItemName(ROD_ITEM + ':' + (1 << item.index));
                            }
                        }
                    }
                    break;
            }
        }
    }
    @EventEntry("LastFloor")
    static makeEvent(action: string, ...arg: EventBase[]): EventBase {
        return new LastFloor(action.split(':'), arg);
    }
}

class TouchEvent extends EventBase {
    constructor(private target: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        const plpos = data.playerData.getPosition();
        if (this.target.includes("Dragon_Fire")) {
            // 特別にドラゴンの炎
            for (let fire of data.getFireList()) {
                let rect: HitRect;
                let sx = fire.bx * BLOCK_SIZE;
                let sy = fire.by * BLOCK_SIZE;
                switch (fire.dir) {
                    case 1:
                        rect = new HitRect(sx, sy - fire.length * BLOCK_SIZE, sx + 16, sy);
                        break;
                    case 2:
                        rect = new HitRect(sx + 16, sy, sx + 16 + fire.length * BLOCK_SIZE, sy + 16);
                        break;
                    case 3:
                        rect = new HitRect(sx, sy + 16, sx + 16, sy + 16 + fire.length * BLOCK_SIZE);
                        break;
                    case 4:
                        rect = new HitRect(sx - fire.length * BLOCK_SIZE, sy, sx, sy + 16);
                        break;
                }
                if (rect!.isHit(plpos.x + 7, plpos.y + 7)) {
                    return EventResult.OK;
                }
            }
        }
        for (let ene of data.getEnemyList()) {
            if (this.target.includes(ene.name)) {
                // チェックする
                const pos = ene.getPosition();
                if (Math.abs(pos.x - plpos.x) <= 12 && Math.abs(pos.y - plpos.y) <= 12) {
                    return EventResult.OK;
                }
            }
        }
        return EventResult.None;
    }
    @EventEntry("Touch")
    static makeEvent(...target: string[]): EventBase {
        return new TouchEvent(target);
    }
}

class RestHP extends EventBase {
    constructor(private hp: number, private enemy: string[]) {
        super();
    }
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        if (this.enemy.length === 0) {
            if (data.playerData.getHP() <= this.hp) {
                return EventResult.OK;
            }
        } else {
            for (let ene of data.getEnemyList()) {
                if (this.enemy.includes(ene.name)) {
                    if (ene.getHP() <= this.hp) {
                        return EventResult.OK;
                    }
                }
            }
        }
        return EventResult.None;
    }
    @EventEntry("RestHP")
    static makeEvent(hp: string, ...enemy: string[]): EventBase {
        return new RestHP(parseInt(hp), enemy);
    }
}

class NoTreasure extends EventBase {
    public checkEvent(data: StageData, event: EventData[]): EventResult {
        return EventResult.None;
    }
    @EventEntry("NoTreasure")
    static makeEvent(): EventBase {
        return new NoTreasure();
    }
}