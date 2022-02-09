import UIX, { Resource, ResourceManger, resource_meta, TreeView } from "../unyt_web/uix/uix.js";
import MonacoHandler from "../unyt_web/uix/uix_std/code_editor/monaco.js";
import { DatexRuntime } from "../unyt_web/unyt_core/datex_runtime.js";
import { UnytTests } from "./tests.js";

UIX.registerEntryType("test_group", "#eee", "");
UIX.registerEntryType("test", "#ddd", "");
UIX.registerEntryType("test_case", "#ddd", "");

UIX.Res.addStrings({
    en: {
        rerun: "Run again"
    },
    de: {
        rerun: "Erneut ausführen"
    }
})

export class TestResourceManager extends ResourceManger {

    constructor(){
        super("tests://")

        UnytTests.onTestCaseResult((group_name:string, test_name:string, index:number, result:typeof UnytTests.SUCCESSFUL|any)=>{
            this.onResourceUpdated(this.getResourceForTest(group_name,test_name,index));
        })

        UnytTests.onTestResult((group_name:string, test_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>{
            this.onResourceUpdated(this.getResourceForTest(group_name,test_name));
        })

        UnytTests.onTestGroupResult((group_name:string, result:typeof UnytTests.SUCCESSFUL|any)=>{
            this.onResourceUpdated(this.getResourceForTest(group_name));
        })
    }

    addResource(resource: Resource, value: any): Promise<void> {
        throw new Error("Method not implemented.");
    }

    addResourceDirectory(resource: Resource): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getResourceValue(resource: Resource){}

    async getMetaData(resource: Resource) {
        if (resource.path_array.length == 1) {
            return {
                html: this.createTestGroupContent(resource.path_array[0], UnytTests.getTestResult(resource.path_array[0])),
                type: 'test_group'
            }
        }

        if (resource.path_array.length == 2) {
            return {
                html: this.createTestContent(resource.path_array[1], UnytTests.getTestResult(resource.path_array[0],resource.path_array[1])),
                type: 'test'
            }
        }

        if (resource.path_array.length == 3) {
            return {
                html: await this.createTestCaseContent(resource.meta.reference, UnytTests.getTestResult(resource.path_array[0],resource.path_array[1],parseInt(resource.path_array[2]))),
                type: 'test_case'
            }
        }
    }
    isDirectory(resource: Resource) {
        return (resource.path_array.length < 2)
    }
    setResourceValue(resource: Resource, value: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async getChildren(resource: Resource, update_meta: boolean) {
        // root, get test groups
        if (resource.path_array.length == 0) {
            let children = [];
            for (let name of UnytTests.getTestsGroups().keys()) {
                children.push([
                    name+'/', 
                    {
                        html:this.createTestGroupContent(name, UnytTests.getTestResult(name)),
                        type: 'test_group'
                    }
                ])
            }
            return children;
        }

        // test group
        if (resource.path_array.length == 1) {
            let children = [];
            for (let name of UnytTests.getTests(resource.path_array[0])?.keys()??[]) {
                children.push([
                    resource.default_path+'/'+name+'/', 
                    {
                        html: this.createTestContent(name, UnytTests.getTestResult(resource.path_array[0],name)),
                        type: 'test'
                    }
                ])
            }
            return children;
        }

        // test
        if (resource.path_array.length == 2) {
            let children = [];
            let i = 0;
            for (let params of UnytTests.getTestCases(resource.path_array[0], resource.path_array[1])??[]) {
                children.push([
                    resource.default_path+'/'+i, 
                    {
                        html: await this.createTestCaseContent(params, UnytTests.getTestResult(resource.path_array[0],resource.path_array[1],i)),
                        type: 'test_case',
                        reference: params
                    }
                ])
                i++;
            }
            return children;
        }

        return null;
    }


    protected getResourceForTest(group_name:string, test_name?:string, index?:number) {
        if (group_name!=undefined && test_name!=undefined && index!=undefined) return Resource.get("tests://"+group_name+"/"+test_name+"/"+index)
        if (group_name!=undefined && test_name!=undefined ) return Resource.get("tests://"+group_name+"/"+test_name+"/")
        return Resource.get("tests://"+group_name+"/")
    }


    protected createTestGroupContent(name:string, result:any = UnytTests.UNKNOWN){
        if (result==UnytTests.SUCCESSFUL)   return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${name}</span>`
        else if (result==UnytTests.UNKNOWN) return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${name}</span>`
        else return `<span style='color:var(--red)'>${UIX.I('fa-times-circle')} ${name}</span>`
    }

    protected createTestContent(name:string, result:any = UnytTests.UNKNOWN){
        if (result==UnytTests.SUCCESSFUL)   return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${name}</span>`
        else if (result==UnytTests.UNKNOWN) return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${name}</span>`
        else return `<span style='color:var(--red)'>${UIX.I('fa-times-circle')} ${name}</span>`
    }

    protected async createTestCaseContent(params:any[], result:any = UnytTests.UNKNOWN){
        let params_string:string
        if (params instanceof Array) {
            params_string = '<span style="color:var(--text_color)">';
            for (let p of params) params_string += DatexRuntime.valueToDatexString(p, false) + ", ";//(await MonacoHandler.colorize(DatexRuntime.valueToDatexString(p, false), 'javascript')).replace(/\<br\/\>$/g, "") + ", ";
            params_string = params_string.slice(0,-2); // remove last comma
            params_string += '</span>'
        }
        else params_string = "?";
      
        if (result==UnytTests.SUCCESSFUL) {
            return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${params_string}</span>`
        }
        else if (result==UnytTests.UNKNOWN) {
            return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${params_string}</span>`
        }
        else {
            return `<span style='color:var(--red)'>${UIX.I('fa-times-circle')} ${params_string} <span style='color:#d26476'>${result}</span></span>`
        }
    }


    renameResource(resource: Resource, new_name: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteResource(resource: Resource): Promise<void> {
        throw new Error("Method not implemented.");
    }
    moveResource(resource: Resource, new_path: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}


@UIX.Element({
    title:"Tests", 
    header:true, 
    search:true,
    font: '14px / 18px Menlo, Monaco, "Courier New", monospace',
    enable_entry_drag: true, // elements can be dragged out
    enable_entry_drop: false, // don't drop other items into the tree
    enable_entry_open: false, // don't open new view on click
    margin: 10,
    root_resource_path:"tests://"
})
export class TestResultView<O extends UIX.Options.TREE_OPTIONS = UIX.Options.TREE_OPTIONS> extends TreeView<O> {
    
    override FILTER_SHOW_INVALID_CHILDREN = true;
    override FILTER_SHOW_INVALID_SIBLINGS = false;
    
    public override async onAnchor() {
        await MonacoHandler.init(); // load monaco first
        this.addStyleSheet(MonacoHandler.standalone_stylesheet);
        await super.onAnchor();
    }

    protected override createContextMenuBody(resource: Resource) {
        return {
            reload: {
                text: UIX.S`rerun`,
                icon: UIX.I`fa-sync-alt`,
                handler: ()=>{
                    UIX.Actions.transitionToURL(location.href)
                }
            }
        }
    }
}
