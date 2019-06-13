import {Subject} from '../subject/subject'

export interface Observer {
    update(subject: Subject): void;
}