//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose") ;
const _ = require("lodash") ;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//////////mongoose database

mongoose.connect("mongodb+srv://admin-calin:test123@cluster0.9ruva.mongodb.net/todolistDB" , {useNewUrlParser : true});
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);

const itemsSchema = {
  name : String
};

// creem un model si colectia se pune la singular("Item")
const Item = mongoose.model("Item" , itemsSchema) ;

// default items
const item1 = new Item ({
  name : "Welcome"
})
const item2 = new Item ({
  name : "Hit the + button to add an item"
})
const item3 = new Item ({
  name : "<-- Hit this to delete an item"
})

const defaultItems = [item1 ,item2 ,item3];

// custom lists
const listSchema = {
  name : String ,
  items : [itemsSchema]
}
const List = mongoose.model("List" , listSchema) ;



//////////get functions

app.get("/", function(req, res) {

  ///
  Item.find( {} , function(err , foundItems){

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems , function(err) {
        if(err) {
          console.log(err);
        }else{
          console.log("Succesfully added");
        }
      });
      res.redirect("/") ;
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });
  ///

});

app.get("/:customListName" , function(req , res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName} , function(err , foundList){
    if(!err) {
      if(!foundList){
        // create new list
        const list = new List({
          name : customListName ,
          items : defaultItems
        })
        list.save();
        res.redirect("/" + customListName) ;
      }else{
        // existing list
        res.render("list" , {listTitle:foundList.name , newListItems : foundList.items})
      }
    }
  })
});


/////////post functions

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list ;

  const item = new Item({
    name : itemName
  }) ;

  if(listName === "Today") {
    item.save() ;
    res.redirect("/") ;
  } else {
    List.findOne({name : listName} , function(err , foundList){
      foundList.items.push(item) ;
      foundList.save() ;
      res.redirect("/" + listName);
    });
  }


});

app.post("/delete", function(req , res){
  const checkedItemId = req.body.checkbox ;
  const listName = req.body.listName ;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId , function(err){
      if(!err){
        console.log("Succesfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name : listName} , {$pull : {items : {_id : checkedItemId}}} , function(err , foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

//////////

let port = process.env.PORT ;
if(port == null || port == "") {
  port = 3000 ;
}

app.listen(port, function() {
  console.log("Server started");
});
