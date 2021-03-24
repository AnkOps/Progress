

exports.getDate=function(){
  let today = new Date();
  let dayNumber=today.getDay();
  let options={
  weekday: "long",
  day: "numeric",
  month: "long"
  };
  return today.toLocaleDateString("en-US", options);
}

exports.getDay=function(){
  let today = new Date();
  let dayNumber=today.getDay();
  let options={
  weekday: "long",

  };
  return today.toLocaleDateString("en-US", options);
}
