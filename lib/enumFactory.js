var EnumFactory = function() {
    if(arguments.length > 0){
        var Enum = function Enum(arg){
            if(typeof arg === 'number' && arg % 1 == 0) {
                return Enum._values[arg];
            } else if(Enum[arg]){
                return Enum[arg]
            } else if (Enum._values.indexOf(arg) !== -1 ) {
                return arg;
            } else if (arg === null) {
                return null;
            } else {
                return '';
            }
        };
        var dxList = [];
        dxList.push(''); // Want empty value to be at index 0 to match MySQL Enum values and MySQL non-strict behavior.
        for(var arg in arguments){
            arg = String(arguments[arg]);
            Object.defineProperty(Enum, arg.toUpperCase(), {configurable: false, enumerable: true, value: arg, writable: false});
            dxList.push(arg);
        }
        Object.defineProperty(Enum, '_values', {configurable: false, enumerable: false, value: dxList, writable: false});
        Object.defineProperty(Enum, '_string', {configurable: false, enumerable: false, value: stringified(Enum), writable: false});
        Object.freeze(Enum);
        return Enum;
    } else {
        throw "No arguments - could not create Enum.";
    }
};

function stringified(anEnum) {
    var s = []; 
    for(var i in anEnum._values){
        if(anEnum._values[i] != ''){
            s.push("'" + anEnum._values[i] + "'");
        }
    }
    return s.join(',');
}

exports.EnumFactory = EnumFactory;







