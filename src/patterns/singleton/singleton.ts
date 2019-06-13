import SubjectModel from '../../patterns/subject/subject';

export default class Singleton {
    private static instance: Singleton;

    protected constructor() {
        if (Singleton.instance) {
            return Singleton.instance;
        }else{
            Singleton.instance = new Singleton();
        }
    }

    public static getInstance(): Singleton {
        if ( !this.instance ) {
            Singleton.instance = new Singleton();
        }

        return Singleton.instance;
    }

}

export class SingletonSubject extends SubjectModel {
    protected constructor(){
        super();
    }
}