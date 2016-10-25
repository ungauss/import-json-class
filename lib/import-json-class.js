'use babel';

import ImportJsonClassView from './import-json-class-view';
import { CompositeDisposable } from 'atom';

export default {

  importJsonClassView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    console.log('activated')
    this.importJsonClassView = new ImportJsonClassView(state.importJsonClassViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.importJsonClassView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'import-json-class:pastejson': () => this.pastejson()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.importJsonClassView.destroy();
  },

  serialize() {
    return {
      importJsonClassViewState: this.importJsonClassView.serialize()
    };
  },

  pastejson() {
    try{
        console.log('pasted some goddamn json');
        try{
            var clip = JSON.parse(atom.clipboard.read());
        } catch (err){
            throw new SyntaxError("invalid JSON");
        }
        var output = "";
        var blocks = [];

        String.prototype.capitalize=function(all){
            if(all){
               return this.split(' ').map(e=>e.capitalize()).join(' ');
            }else{
                 return this.charAt(0).toUpperCase() + this.slice(1);
            }
        }

        function genClasses(parentName, obj){
            var block = "public class "+parentName+"\n{\n";
            var array = false;
            var keyValue = null;
            function isArray(isArray){ return isArray ? "[] " : " "; }
            Object.keys(obj).forEach(function(key, index){
                keyValue = obj[key]
                if (keyValue instanceof Array){
                    array = true;
                    keyValue = obj[key][0];
                }
                if (keyValue == null){
                    block +=  "\tpublic ???"+ isArray(array) + key +" { get; set; }\n";
                } else {
                    switch(typeof keyValue){
                        case 'string':
                            block +=  "\tpublic string"+ isArray(array)+key+" { get; set; }\n";
                            break;
                        case 'boolean':
                            block +=  "\tpublic bool"+ isArray(array) +key+" { get; set; }\n";
                            break;
                        case 'number':
                            if (obj[key] % 1 === 0){
                                block +=  "\tpublic int"+ isArray(array) +key+" { get; set; }\n";
                            }else{
                                block +=  "\tpublic double" + isArray(array) +key+" { get; set; }\n";
                            }
                            break;
                        case 'object':
                            block +=  "\tpublic " + key.toLowerCase().capitalize() + isArray(array) + key + " { get; set; }\n";
                            genClasses(key.toLowerCase().capitalize(), obj[key]);
                            break;
                        default:
                            block +=  "\tpublic ???"+ isArray(array) + key +" { get; set; }\n";
                    }
                }
            });
            block += "}\n\n";
            blocks.push(block);
        }

        genClasses("Rootobject", clip);
        console.log(blocks);
        for (var i=blocks.length; i--; i>= 0){
            output += blocks[i];
        }
        atom.workspace.getActiveTextEditor().insertText(output);
    } catch (err){
        atom.notifications.addError(err.message, {"dismissable":true});
    }
  }
};
