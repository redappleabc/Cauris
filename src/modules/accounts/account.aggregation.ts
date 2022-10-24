const mongoose = require("mongoose");

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