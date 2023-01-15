import API from "./API";


export class ExpenseAPI {


    // static getGmailUpdates(){
    //     authorize().then(listLabels).catch(console.error);
    // }

    static tagExpense(id: number, tag: string){
        return API._get(`/api/expense/tagExpense/${id}/${tag}`);
    }


    static autoTagExpense(vendor: string, tag: string){
        return API._get(`/api/expense/autoTagExpense/${vendor}/${tag}`);
    }

    static getUnTaggedExpenseList(){
        return API._get(`/api/expense/unTagged`);
    }

    static getExpenseList(){
        return API._get(`/api/expense/all`);
    }

    static addExpenses(time: string, data: any){
        return API._post(`/api/expense/${time}`, data);
    }

    static getUpdatedTime(){
        return API._get(`/api/appConfig/updatedTime`);
    }

    static updateTime(updateStartTime: string){
        return API._get(`/api/appConfig/updateTime/${updateStartTime}`);
    }

}