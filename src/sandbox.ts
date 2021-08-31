let items = [
  {
    "index": {
      "S": "1588"
    },
    "val": {
      "S": "28675307bc8df7faf345106ff9b54fe90cf8245c"
    }
  },
  {
    "index": {
      "S": "8826"
    },
    "val": {
      "S": "3fe01916f54cb8e5035a464fee7dd7b52610742a"
    }
  }
]

interface Item {
  [key:string]: Object | undefined
}

const newItems = [];
for (let item of items) {
  let newItem:Item = {
    blittan: 'blattan',
    bluttan: 'bluttan'
  }
  Object.assign(newItem, item, { ['newVal']: item['val'] })['val']

  newItems.push(newItem);
}

console.log(newItems);