use servichain
db.runCommand(
  {
    update: 'users',
    updates: [
      {
        q: {},
        u: [
          {
            '$set': {
              'username': {
                '$regexFind': {
                  'input': '$email', 
                  'regex': '[^(@.)]+'
                }
              }
            }
          }, {
            '$set': {
              'username': {
                '$concat': [
                  '$username.match'
                ]
              }
            }
          }
        ],
        multi: true
      }
    ],
    ordered: false,
    writeConcern: {w: "majority", wtimeout: 5000}
  }
)