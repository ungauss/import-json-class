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
    console.log('pasted some goddamn json');
    var clip = JSON.parse(atom.clipboard.read());
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
        Object.keys(obj).forEach(function(key, index){
            if (obj[key] instanceof Array){
                if (obj[key].length === 0){
                    block = block + "\tpublic ???[] "+key+" { get; set; }\n";
                }else{
                    switch(typeof obj[key][0]){
                        case 'string':
                            block = block + "\tpublic string[] "+key+" { get; set; }\n";
                            break;
                        case 'boolean':
                            block = block + "\tpublic bool[] "+key+" { get; set; }\n";
                            break;
                        case 'number':
                            if (obj[key] % 1 === 0){
                                block = block + "\tpublic int[] "+key+" { get; set; }\n";
                            }else{
                                block = block + "\tpublic double[] "+key+" { get; set; }\n";
                            }
                            break;
                        case 'object':
                            block = block + "\tpublic "+key.toLowerCase().capitalize()+"[] "+key+" { get; set; }\n";
                            genClasses(key.toLowerCase().capitalize(), obj[key]);
                            break;
                        default:
                            block = block + "\tpublic ???[] "+key+" { get; set; }\n";
                    }
                }
            }else{
                switch(typeof obj[key]){
                    case 'string':
                        block = block + "\tpublic string "+key+" { get; set; }\n";
                        break;
                    case 'boolean':
                        block = block + "\tpublic bool "+key+" { get; set; }\n";
                        break;
                    case 'number':
                        if (obj[key] % 1 === 0){
                            block = block + "\tpublic int "+key+" { get; set; }\n";
                        }else{
                            block = block + "\tpublic double "+key+" { get; set; }\n";
                        }
                        break;
                    case 'object':
                        block = block + "\tpublic "+key.toLowerCase().capitalize()+" "+key+" { get; set; }\n";
                        genClasses(key.toLowerCase().capitalize(), obj[key]);
                        break;
                    default:
                        block = block + "\tpublic ??? "+key+" { get; set; }\n";
                }
            }
        });
        block = block+"}\n\n";
        blocks.push(block);
    }

    genClasses("Rootobject", clip);
    console.log(blocks);
    for (var i=blocks.length; i--; i>= 0){
        output=output+blocks[i];
    }
    atom.workspace.getActiveTextEditor().insertText(output);
  }

};
