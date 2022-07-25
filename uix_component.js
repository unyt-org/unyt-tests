var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import UIX, { Resource, ResourceManger } from "../unyt_web/uix/uix.js";
import MonacoHandler from "../unyt_web/uix/uix_std/code_editor/monaco.js";
import { Datex } from "../unyt_web/unyt_core/datex_runtime.js";
import { UnytTests } from "./tests.js";
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
});
export class TestResourceManager extends ResourceManger {
    constructor() {
        super("tests://");
        UnytTests.onTestCaseResult((group_name, test_name, index, result) => {
            this.onResourceUpdated(this.getResourceForTest(group_name, test_name, index));
        });
        UnytTests.onTestResult((group_name, test_name, result) => {
            this.onResourceUpdated(this.getResourceForTest(group_name, test_name));
        });
        UnytTests.onTestGroupResult((group_name, result) => {
            this.onResourceUpdated(this.getResourceForTest(group_name));
        });
    }
    addResource(resource, value) {
        throw new Error("Method not implemented.");
    }
    addResourceDirectory(resource) {
        throw new Error("Method not implemented.");
    }
    getResourceValue(resource) { }
    async getMetaData(resource) {
        if (resource.path_array.length == 1) {
            return {
                html: this.createTestGroupContent(resource.path_array[0], await UnytTests.getTestResult(resource.path_array[0])),
                type: 'test_group'
            };
        }
        if (resource.path_array.length == 2) {
            return {
                html: this.createTestContent(resource.path_array[0], resource.path_array[1], await UnytTests.getTestResult(resource.path_array[0], resource.path_array[1])),
                type: 'test'
            };
        }
        if (resource.path_array.length == 3) {
            return {
                html: await this.createTestCaseContent(resource.meta.reference, await UnytTests.getTestResult(resource.path_array[0], resource.path_array[1], parseInt(resource.path_array[2]))),
                type: 'test_case'
            };
        }
    }
    async isDirectory(resource) {
        return resource.path_array.length == 0 ||
            resource.path_array.length == 1 ||
            (resource.path_array.length == 2 && ((await UnytTests.getTestCases(resource.path_array[0], resource.path_array[1])) != UnytTests.NO_PARAMS));
    }
    setResourceValue(resource, value) {
        throw new Error("Method not implemented.");
    }
    async getChildren(resource, update_meta) {
        if (resource.path_array.length == 0) {
            let children = [];
            for (let name of (await UnytTests.getTestsGroups()).keys()) {
                children.push([
                    name + '/',
                    {
                        html: this.createTestGroupContent(name, await UnytTests.getTestResult(name)),
                        type: 'test_group'
                    }
                ]);
            }
            return children;
        }
        if (resource.path_array.length == 1) {
            let children = [];
            for (let name of (await UnytTests.getTests(resource.path_array[0]))?.keys() ?? []) {
                children.push([
                    resource.default_path + '/' + name + ((await UnytTests.getTestCases(resource.path_array[0], name)) == UnytTests.NO_PARAMS ? '' : '/'),
                    {
                        html: this.createTestContent(resource.path_array[0], name, await UnytTests.getTestResult(resource.path_array[0], name)),
                        type: 'test'
                    }
                ]);
            }
            return children;
        }
        if (resource.path_array.length == 2) {
            const test_cases = await UnytTests.getTestCases(resource.path_array[0], resource.path_array[1]);
            if (test_cases == UnytTests.NO_PARAMS)
                return null;
            let children = [];
            let i = 0;
            for (let params of test_cases ?? []) {
                children.push([
                    resource.default_path + '/' + i,
                    {
                        html: await this.createTestCaseContent(params, await UnytTests.getTestResult(resource.path_array[0], resource.path_array[1], i)),
                        type: 'test_case',
                        reference: params
                    }
                ]);
                i++;
            }
            return children;
        }
        return null;
    }
    getResourceForTest(group_name, test_name, index) {
        if (group_name != undefined && test_name != undefined && index != undefined)
            return Resource.get("tests://" + group_name + "/" + test_name + "/" + index);
        if (group_name != undefined && test_name != undefined)
            return Resource.get("tests://" + group_name + "/" + test_name + "/");
        return Resource.get("tests://" + group_name + "/");
    }
    createTestGroupContent(name, result = UnytTests.PENDING) {
        name = UIX.Utils.escapeHtml(name);
        if (result == UnytTests.SUCCESSFUL)
            return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${name}</span>`;
        else if (result == UnytTests.PENDING)
            return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${name}</span>`;
        else
            return `<span style='color:var(--red)'>${UIX.I('fa-times-circle')} ${name}</span>`;
    }
    createTestContent(group_name, name, result = UnytTests.PENDING) {
        const has_no_test_cases = UnytTests.getTestCases(group_name, name) == UnytTests.NO_PARAMS;
        name = UIX.Utils.escapeHtml(name);
        if (result == UnytTests.SUCCESSFUL)
            return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${name}</span>`;
        else if (result == UnytTests.PENDING)
            return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${name}</span>`;
        else
            return `<span style='color:var(--red)'>${UIX.I('fa-times-circle')}
                ${name}
                ${has_no_test_cases ? `<span style='color:#d26476'>${UIX.Utils.escapeHtml(result instanceof Error ? (result.name + ": " + result.message) : result)}</span>` : ''}
            </span>`;
    }
    async createTestCaseContent(params, result = UnytTests.PENDING) {
        let params_string;
        if (params instanceof Array) {
            params_string = '<span style="color:var(--text_color)">';
            for (let p of params)
                params_string += UIX.Utils.escapeHtml(Datex.Runtime.valueToDatexString(p, false)) + ", ";
            if (params.length)
                params_string = params_string.slice(0, -2);
            params_string += '</span>';
        }
        else
            params_string = "?";
        if (result == UnytTests.SUCCESSFUL) {
            return `<span style='color:var(--green)'>${UIX.I('fa-check-circle')} ${params_string}</span>`;
        }
        else if (result == UnytTests.PENDING) {
            return `<span style='color:var(--yellow)'>${UIX.I('fa-circle')} ${params_string}</span>`;
        }
        else {
            return `<span style='color:var(--red)'>
                    ${UIX.I('fa-times-circle')}
                    ${params_string}
                    <span style='color:#d26476'>${UIX.Utils.escapeHtml(result instanceof Error ? (result.name + ": " + result.message) : result)}</span>
                </span>`;
        }
    }
    renameResource(resource, new_name) {
        throw new Error("Method not implemented.");
    }
    deleteResource(resource) {
        throw new Error("Method not implemented.");
    }
    moveResource(resource, new_path) {
        throw new Error("Method not implemented.");
    }
}
let TestResultView = class TestResultView extends UIX.Components.Tree {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "FILTER_SHOW_INVALID_CHILDREN", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "FILTER_SHOW_INVALID_SIBLINGS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "CONTEXT_MENU_HEADER_LEFT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
    }
    async onInit() {
        this.updateBorderColor(await UnytTests.getTestResult());
        await UnytTests.onAllTestsResult((result) => this.updateBorderColor(result));
    }
    updateBorderColor(result) {
        if (result == UnytTests.SUCCESSFUL)
            this.border_color = 'UIX.Theme.green';
        else if (result == UnytTests.PENDING)
            this.border_color = 'UIX.Theme.yellow';
        else
            this.border_color = 'UIX.Theme.red';
    }
    async onAnchor() {
        await MonacoHandler.init();
        this.addStyleSheet(MonacoHandler.standalone_stylesheet);
        await super.onAnchor();
    }
    createContextMenuBody(resource) {
        return {
            reload: {
                text: UIX.S `run_test`,
                icon: UIX.I `fa-play`,
                handler: () => {
                    console.log("run " + resource, resource.path_array.length);
                    if (resource.path_array.length == 1) {
                        UnytTests.runTests(resource.path_array[0]);
                    }
                    else if (resource.path_array.length == 2) {
                        UnytTests.runTest(resource.path_array[0], resource.path_array[1]);
                    }
                    else if (resource.path_array.length == 3) {
                    }
                }
            }
        };
    }
};
TestResultView = __decorate([
    UIX.Component({
        title: "Tests",
        header: true,
        search: true,
        font: '14px / 18px Menlo, Monaco, "Courier New", monospace',
        enable_entry_drag: true,
        enable_entry_drop: false,
        enable_entry_open: false,
        margin: 10,
        border: 2,
        root_resource_path: "tests://"
    })
], TestResultView);
export { TestResultView };
