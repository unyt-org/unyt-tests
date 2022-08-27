import UIX, { Resource, ResourceManger} from "../uix/uix.js";
import MonacoHandler from "../uix/uix_std/code_editor/monaco.js";
import { Datex } from "../unyt_core/datex_runtime.js";
import { setTestResourceManager, UnytTests } from "./test_manager.js";

UIX.registerEntryType("test_group", "#eee", "");
UIX.registerEntryType("test", "#ddd", "");
UIX.registerEntryType("test_case", "#ddd", "");

UIX.Res.addStrings({
    en: {
        run_test: "Run test"
    },
    de: {
        run_test: "Test ausführen"
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
                html: this.createTestGroupContent(resource.path_array[0], await UnytTests.getTestResult(resource.path_array[0])),
                type: 'test_group'
            }
        }

        if (resource.path_array.length == 2) {
            return {
                html: this.createTestContent(resource.path_array[0], resource.path_array[1], await UnytTests.getTestResult(resource.path_array[0],resource.path_array[1])),
                type: 'test'
            }
        }

        if (resource.path_array.length == 3) {
            return {
                html: await this.createTestCaseContent(resource.meta.reference, await UnytTests.getTestResult(resource.path_array[0],resource.path_array[1],parseInt(resource.path_array[2]))),
                type: 'test_case'
            }
        }
    }
    async isDirectory(resource: Resource) {
        return resource.path_array.length == 0 ||
            resource.path_array.length == 1 ||  
            (resource.path_array.length == 2 && ((await UnytTests.getTestCases(resource.path_array[0], resource.path_array[1])) != UnytTests.NO_PARAMS))
    }
    setResourceValue(resource: Resource, value: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async getChildren(resource: Resource, update_meta: boolean) {
        // root, get test groups
        if (resource.path_array.length == 0) {
            let children = [];
            for (let name of (await UnytTests.getTestsGroups()).keys()) {
                children.push([
                    name+'/', 
                    {
                        html:this.createTestGroupContent(name, await UnytTests.getTestResult(name)),
                        type: 'test_group'
                    }
                ])
            }
            return children;
        }

        // test group
        if (resource.path_array.length == 1) {
            let children = [];
            for (let name of (await UnytTests.getTests(resource.path_array[0]))?.keys()??[]) {
                children.push([
                    resource.default_path+'/'+name+((await UnytTests.getTestCases(resource.path_array[0],name)) == UnytTests.NO_PARAMS ? '' : '/'), 
                    {
                        html: this.createTestContent(resource.path_array[0], name, await UnytTests.getTestResult(resource.path_array[0],name)),
                        type: 'test'
                    }
                ])
            }
            return children;
        }

        // test
        if (resource.path_array.length == 2) {
            const test_cases = await UnytTests.getTestCases(resource.path_array[0], resource.path_array[1]);
            if (test_cases == UnytTests.NO_PARAMS) return null; // no test case children

            let children = [];
            let i = 0;
            for (let params of test_cases??[]) {
                children.push([
                    resource.default_path+'/'+i, 
                    {
                        html: await this.createTestCaseContent(params, await UnytTests.getTestResult(resource.path_array[0],resource.path_array[1],i)),
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


    protected createTestGroupContent(name:string, result:any = UnytTests.PENDING){
        name = UIX.Utils.escapeHtml(name);
        if (result==UnytTests.SUCCESSFUL)   return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${name}</span>`
        else if (result==UnytTests.PENDING) return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${name}</span>`
        else return `<span style='color:var(--red)'>${UIX.I('fa-times-circle')} ${name}</span>`
    }

    protected createTestContent(group_name:string, name:string, result:any = UnytTests.PENDING){
        const has_no_test_cases = UnytTests.getTestCases(group_name, name) == UnytTests.NO_PARAMS;
        name = UIX.Utils.escapeHtml(name);
        if (result==UnytTests.SUCCESSFUL)   return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${name}</span>`
        else if (result==UnytTests.PENDING) return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${name}</span>`
        else return `<span style='color:var(--red)'>${UIX.I('fa-times-circle')}
                ${name}
                ${has_no_test_cases? `<span style='color:#d26476'>${UIX.Utils.escapeHtml(result instanceof Error ? (result.name + ": " + result.message) : result)}</span>` : ''}
            </span>`
    }

    protected async createTestCaseContent(params:any[], result:any = UnytTests.PENDING){
        let params_string:string
        if (params instanceof Array) {
            params_string = '<span style="color:var(--text_color)">';
            for (let p of params) params_string += UIX.Utils.escapeHtml(Datex.Runtime.valueToDatexString(p, false)) + ", ";//(await MonacoHandler.colorize(DatexRuntime.valueToDatexString(p, false), 'javascript')).replace(/\<br\/\>$/g, "") + ", ";
            if (params.length) params_string = params_string.slice(0,-2); // remove last comma
            params_string += '</span>'
        }
        else params_string = "?";
      
        if (result==UnytTests.SUCCESSFUL) {
            return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${params_string}</span>`
        }
        else if (result==UnytTests.PENDING) {
            return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${params_string}</span>`
        }
        else {
            return `<span style='color:var(--red)'>
                    ${UIX.I('fa-times-circle')}
                    ${params_string}
                    <span style='color:#d26476'>${UIX.Utils.escapeHtml(result instanceof Error ? (result.name + ": " + result.message) : result)}</span>
                </span>`
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

setTestResourceManager(TestResourceManager);

@UIX.Component({
    title:"Tests", 
    header:true, 
    search:true,
    font: '14px / 18px Menlo, Monaco, "Courier New", monospace',
    enable_entry_drag: true, // elements can be dragged out
    enable_entry_drop: false, // don't drop other items into the tree
    enable_entry_open: false, // don't open new view on click
    margin: 10,
    border: 2,
    root_resource_path:"tests://"
})
export class TestResultView<O extends UIX.Components.Tree.Options = UIX.Components.Tree.Options> extends UIX.Components.Tree<O> {
    
    override FILTER_SHOW_INVALID_CHILDREN = true;
    override FILTER_SHOW_INVALID_SIBLINGS = false;

    override CONTEXT_MENU_HEADER_LEFT = true;
    

    protected override async onInit() {
        this.updateBorderColor(await UnytTests.getTestResult());
        await UnytTests.onAllTestsResult((result:typeof UnytTests.SUCCESSFUL|any)=>this.updateBorderColor(result))
    }

    // updates the border color to red, yellow or green according to current test result
    protected updateBorderColor(result:any) {
        if (result == UnytTests.SUCCESSFUL) this.border_color = 'UIX.Theme.green'
        else if (result == UnytTests.PENDING) this.border_color = 'UIX.Theme.yellow'
        else this.border_color = 'UIX.Theme.red'
    }

    public override async onAnchor() {
        await MonacoHandler.init(); // load monaco first
        this.addStyleSheet(MonacoHandler.standalone_stylesheet);
        await super.onAnchor();
    }

    protected override createContextMenuBody(resource: Resource):UIX.Types.context_menu {
        return {
            reload: {
                text: UIX.S`run_test`,
                icon: UIX.I`fa-play`,
                handler: ()=>{
                    console.log("run " + resource, resource.path_array.length);
                    if (resource.path_array.length == 1) {
                        UnytTests.runTests(resource.path_array[0])
                    }

                    else if (resource.path_array.length == 2) {
                        UnytTests.runTest(resource.path_array[0], resource.path_array[1])
                    }

                    else if (resource.path_array.length == 3) {
                        //UnytTests.runTestCase(resource.path_array[0], resource.path_array[1], parseInt(resource.path_array[2]))
                    }
                    //UIX.Actions.transitionToURL(location.href)
                }
            }
        }
    }
}
