export default {

  formatByType(formatters, type, obj, textKey) {
    if(formatters && typeof formatters[type] === "function") {
      return formatters[type](obj);
    }
    return obj[textKey];
  }

}