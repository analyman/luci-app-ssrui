/* fucking */

/* activeChange, raise when the active child whose class contain active changed */
export class UActiveChange extends Event {
    static eventName = UActiveChange.name;
    where: number;
    public constructor(where: number) {
        super(UActiveChange.eventName);
        this.where = where;
    }
};

/* when this event occurs, the element should update its contents */
export class UContentChange extends Event {
    static eventName = UContentChange.name;
    public constructor() {
        super(UContentChange.eventName);
    }
};
