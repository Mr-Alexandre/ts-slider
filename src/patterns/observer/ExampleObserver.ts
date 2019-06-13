import {Observer} from "./observer";
import {SubjectSelect} from "../subject/subject";

export default class ExampleObserver implements Observer {

    public update(subject: SubjectSelect): void {
        document.querySelector('.lav-observer-example-output').textContent = subject.Value;
    }

}