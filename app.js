//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require ("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-marcin:bombitrombi@cluster0-55ege.mongodb.net/todolistDB", {useNewUrlParser: true});


// Schema for homepage todolist items
const itemsSchema = {
  name: String,
};

// declaring mongoose model for itemsSchema
const Item = mongoose.model("Item" , itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});
const item2 = new Item ({
  name: "Hit the + button to add a new item."
});
const item3 = new Item ({
  name: "<--- Hit this to delete an item."
});

// adding 3 items to viarable to use it on homepage
const defaultItems = [item1, item2, item3];



// Schema for new list
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


// Rendering 3 starting items on todo list in homepage
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    // check if foundItems is empty array
  if (foundItems.length === 0) {
    Item.insertMany(defaultItems, function(err){
      if(err) {
        console.log(err);
      }else {
        console.log("Default items successfully added to DB.");
      }
    });
    res.redirect("/");
  }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
  }
  });
});



// Using params custom list name, user will have access to custom todo list
app.get("/:customListName", function (req, res) {
     const customListName = _.capitalize(req.params.customListName);

     // Checking if List is in DB's
     List.findOne({name:customListName}, function (err, foundList){
       if (!err) {
         if (!foundList){
           //Create a new List
           const list = new List ({
             name: customListName,
             items: defaultItems
           });
           list.save();
           res.redirect("/"+customListName);
       }else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
       }
     }
     });
});


app.post("/", function(req, res){
// saving new items input in database
const itemName = req.body.newItem;
const listName = req.body.list;

const item = new Item ({
  name: itemName
});

// check if list is a default list 'Today'
if (listName === "Today") {
  item.save();
  res.redirect("/");
  // if not, find list.name in database and create new item in it
}else{
  List.findOne({name: listName}, function (err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  });
}
});


// deleting items from database by checking the checkbox
app.post("/delete", function (req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
  Item.findByIdAndRemove(checkedItemId, function (err){
    if (err) {
      console.log(err);
    }else {
      console.log("Item successfully deleted");
      res.redirect("/");
    };
  });
  } else {
    List.findOneAndUpdate({name:listName}, {$pull: {items: {_id:checkedItemId}}}, function (err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

// Heroku port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
