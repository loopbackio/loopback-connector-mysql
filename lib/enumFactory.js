function Enum() {
    if(arguments.length > 0){
        var dxList = [];
        dxList.push(''); // Want empty value to be at index 0 to match MySQL Enum values and MySQL non-strict behavior.
        for(var arg in arguments){
            arg = String(arguments[arg]);
            Object.defineProperty(this, arg.toUpperCase(), {configurable: false, enumerable: true, value: arg, writable: false});
            dxList.push(arg);
        }
        Object.defineProperty(this, '_values', {configurable: false, enumerable: false, value: dxList, writable: false});
        Object.defineProperty(this, '_string', {configurable: false, enumerable: false, value: stringified(this), writable: false});
        Object.freeze(this);
        return this;
    } else {
        throw "No arguments - can't create Enum.";
    }
};
Object.defineProperty(Enum.prototype, 'name', {configurable: false, enumerable: false, value: 'Enum', writable: false});


var EnumFactory = (function() {
    function FakeEnumConstructor(args) {
        return Enum.apply(this, args);
    }
    
    FakeEnumConstructor.prototype = Enum.prototype;

    return function() {
        var returnObject = new FakeEnumConstructor(arguments);
        returnObject.constructor = Enum.constructor;
        return returnObject;
    }
})();

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
exports.Enum = Enum;






