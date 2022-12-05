const mongoose = require("mongoose");

export function addressesAggregation(
  limit=20, 
  skip=0, 
  network: string = null
  ) {
  return [
    {
      '$limit': Number(limit)
    },
    {
      '$skip': Number(skip)
    },
    {
      '$lookup': {
        'from': 'wallets', 
        'localField': '_id', 
        'foreignField': 'user', 
        'as': 'wallets'
      }
    }, {
      '$unwind': {
        'path': '$wallets'
      }
    }, {
      '$lookup': {
        'from': 'accounts', 
        'localField': 'wallets._id', 
        'foreignField': 'wallet', 
        'as': 'accounts'
      }
    }, {
      '$unwind': {
        'path': '$accounts'
      }
    }, {
      '$addFields': {
        'subscribedCoins': '$accounts.subscribedTo'
      }
    }, {
      '$unwind': {
        'path': '$subscribedCoins'
      }
    }, {
      '$lookup': {
        'from': 'coins', 
        'localField': 'subscribedCoins', 
        'foreignField': '_id', 
        'as': 'subscribedCoins'
      }
    }, {
      '$unwind': {
        'path': '$subscribedCoins'
      }
    }, {
      '$lookup': {
        'from': 'networks', 
        'localField': 'subscribedCoins.network', 
        'foreignField': '_id', 
        'as': 'network'
      }
    }, {
      '$unwind': {
        'path': '$network'
      }
    },
    {
      '$match': network ? {'$network.name': network} : {}
    },
    {
      '$group': {
        '_id': {
          'user': '$_id', 
          'network': '$network._id'
        }, 
        'email': {
          '$first': '$email'
        }, 
        'verified': {
          '$first': '$verified'
        }, 
        'accounts': {
          '$addToSet': '$accounts'
        }, 
        'network': {
          '$first': '$network'
        }, 
        'subscribedCoins': {
          '$push': '$subscribedCoins'
        }
      }
    }, {
      '$addFields': {
        'network.accounts': '$accounts'
      }
    }, {
      '$group': {
        '_id': '$_id.user', 
        'email': {
          '$first': '$email'
        }, 
        'verified': {
          '$first': '$verified'
        }, 
        'networks': {
          '$push': {
            '_id': '$network._id', 
            'name': '$network.name', 
            'accounts': '$network.accounts'
          }
        }, 
        'subscribedCoins': {
          '$addToSet': '$subscribedCoins'
        }
      }
    }
  ]
  /*[
    {
      '$lookup': {
        'from': 'wallets', 
        'localField': 'wallet', 
        'foreignField': '_id', 
        'as': 'wallet'
      }
    }, {
      '$unwind': {
        'path': '$wallet'
      }
    }, {
      '$lookup': {
        'from': 'users', 
        'localField': 'wallet.user', 
        'foreignField': '_id', 
        'as': 'userData'
      }
    }, {
      '$unwind': {
        'path': '$userData'
      }
    }, {
      '$set': {
        'user': {
          'email': '$userData.email', 
          'username': '$userData.username', 
          'verified': '$userData.verified'
        }
      }
    }, {
      '$unset': [
        'wallet', 'accountIndex', 'addressIndex', 'publicKey', 'change', '__v', 'userData'
      ]
    }, {
      '$lookup': {
        'from': 'coins', 
        'localField': 'coinIndex', 
        'foreignField': 'coinIndex', 
        'as': 'coin'
      }
    }, {
      '$unwind': {
        'path': '$coin'
      }
    }, {
      '$lookup': {
        'from': 'networks', 
        'localField': 'coin.network', 
        'foreignField': '_id', 
        'as': 'network'
      }
    }, {
      '$unwind': {
        'path': '$network'
      }
    }, {
      '$set': {
        'coin': '$coin.name', 
        'network': '$network'
      }
    },
    {
      '$match': coinName ? {coin: coinName} : {}
    }
  ]*/
}

export function accountsAggregation(wallet: string = null, userId: string) {
    return [
    /*{
      $lookup: {
        from: 'wallets',
        localField: 'wallet',
        foreignField: '_id',
        as: 'wallet'
      }
    },
    {
      $unwind: "$wallet"
    },
    {
      $match: {'wallet.user': mongoose.Types.ObjectId(userId) }
    },*/
    {
      $match: wallet
        ? { wallet: mongoose.Types.ObjectId(wallet) }
        : {},
    },
    {
      $lookup: {
        from: 'wallets',
        localField: 'wallet',
        foreignField: '_id',
        as: 'wallet'
      }
    },
    {
      $unwind: "$wallet"
    },
    {
      $unwind: {
        path: "$subscribedTo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "coins",
        localField: "subscribedTo",
        foreignField: "_id",
        as: "subscribedTo",
      },
    },
    {
      $unwind: {
        path: "$subscribedTo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "networks",
        localField: "subscribedTo.network",
        foreignField: "_id",
        as: "network_infos",
      },
    },
    {
      $unwind: {
        path: "$network_infos",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        network_infos: { $ifNull: ["$network_infos", "hidden"] },
      },
    },
  ]
}

export function contactAggregation(username: string, coinId: string) {
    return [
        {
          $match: {
            username
          }
        }, {
          $lookup: {
            from: "wallets", 
            localField: "_id", 
            foreignField: "user", 
            as: "wallets"
          }
        }, {
          $lookup: {
            from: 'accounts', 
            localField: 'wallets._id', 
            foreignField: 'wallet', 
            as: 'accounts'
          }
        }, {
          $unwind: {
            path: '$accounts'
          }
        }, {
          $match: {
            $expr: {
              $and: [{
                  $in: [mongoose.Types.ObjectId(coinId), '$accounts.subscribedTo']
              }]
            }
          }
        }, {
          $addFields: {
            address: '$accounts.address'
          }
        }
      ]
}