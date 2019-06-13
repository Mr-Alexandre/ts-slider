import {Observer} from '../observer/observer'

export interface Subject {
    attach(observer: Observer): void;
    detach(observer: Observer): void;
    notify(): void;
}

export interface SubjectSelect extends Subject{
    Value: string;
}

export default abstract class SubjectModel implements Subject {
    private observers: Observer[];

    public attach(observer: Observer): void {
        this.observers.push(observer);
    }
    public detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer);
        this.observers.splice(observerIndex, 1);
    }
    public notify(): void {
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

}