import { forOfStatement } from "@babel/types";
import axios, {Method} from "axios";
import { METHODS } from "http";

export default class API {

    

    static _get(url: string){
        return this._withPayLoad(url, 'GET', {})
    }

    static _post(url: string, data: any){
        return this._withPayLoad(url, 'POST', data)
    }

    static _delete(url: string){
        return this._withPayLoad(url, 'DELETE', {})
    }


    static _withPayLoad(url: string, method: Method, data = {}){
        console.log("API - ", method, ": ", url);

        return axios({
            method: method,
            // url: 'https://4db4-2409-4071-e0e-b1f6-f44b-5f3d-9730-454c.in.ngrok.io' + url,
            url: 'http://192.168.1.103:8080' + url,
            data: Object.keys(data).length > 0? JSON.stringify(data): null,
            headers: {'Content-type' : 'application/json', 'ngrok-skip-browser-warning': 'any value'},
            // auth: {
            //     username: 'foo',
            //     password: 'bar'
            // }

        }).then(response => {
            if (response.status === 200)
                return response.data;
            
            else{
                console.log(url);
                console.error('Response error: ', response.status);
                console.error('Response error: ', response);
                return 'Error'
            }
        }).catch(error => {

            console.error('Error : ', JSON.stringify(error.message));
            console.error('Error : ', JSON.stringify(error));
            throw error;
        })
    }
}