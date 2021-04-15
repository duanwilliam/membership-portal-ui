import { COLLECTION_ERROR, FETCH_COLLECTIONS, ThunkActionCreator } from './storeTypes';

import Config from '../config';
import Storage from '../storage';
import { notify } from '../utils';
import { fetchUserByID, logoutUser } from '../auth/authActions';
import { Order, PatchOrderItemPayload, User } from '../types';

/**
 * Reviver function for JSON parser on Order to convert ISO 8601 timestamp
 * to Date object.
 *
 * @param {string} key Current key in JSON object.
 * @param {string} value Value of key in JSON object.
 * @return {Date | string} Date object if key is "orderedAt", same value if not.
 */
const dateTimeReviver = (key: string, value: string) => {
  return key === 'orderedAt' ? new Date(value) : value;
};

export const fetchCollections: ThunkActionCreator = () => async (dispatch) => {
  try {
    const collectionsRes = await fetch(Config.API_URL + Config.routes.store.collection, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Storage.get('token')}`,
      },
    });

    const data = await collectionsRes.json();

    if (!data) throw new Error('Empty response from server');
    if (data.error) throw new Error(data.error.message);
    dispatch({
      type: FETCH_COLLECTIONS,
      payload: data.collections,
    });
  } catch (error) {
    notify('Unable to fetch store collections!', error.message);
    dispatch({
      type: COLLECTION_ERROR,
      payload: error.message,
    });
  }
};

/**
 * Patches order in the API by receiving a set of supported properties
 * to patch OrderItems with. Check the type of PatchOrderItemPayload
 * for supported properties to patch.
 *
 * @param {ThunkDispatch} dispatch Dispatch function for adminOrderReducer.
 * @param {Order} order Order to patch. Only UUID is really required.
 * @param {PatchOrderItemPayload[]} newItems Array of changes to OrderItems in Order.
 */
export const patchOrder = async (dispatch, order: Order, newItems: PatchOrderItemPayload[]) => {
  try {
    const orderPatchRoute = await fetch(Config.API_URL + Config.routes.store.order, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Storage.get('token')}`,
      },
      body: JSON.stringify({ items: newItems }),
    });

    const data = await orderPatchRoute.json();

    if (!data) throw new Error('Empty response from server');
    if (data.error) throw new Error(data.error.message);
    dispatch({
      type: 'PATCH_ORDER',
      order: order.uuid,
      newItems,
    });
  } catch (error) {
    notify('Unable to update order', error.message);
  }
};

/**
 * Gets all orders currently present in the API. The administrator accounts
 * will have access to all orders.
 *
 * This function also queries for the public user information of the users
 * who submitted each order.
 *
 * @param {ThunkDispatch} dispatch Dispatch function for adminOrderReducer.
 */
export const getAllOrders = async (dispatch) => {
  try {
    const orderGetRoute = await fetch(Config.API_URL + Config.routes.store.order, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Storage.get('token')}`,
      },
    });

    const response = await orderGetRoute.text();
    const data = JSON.parse(response, dateTimeReviver);

    const orderUsersRequests: Promise<User>[] = [];
    for (let i = 0; i < data.orders.length; i += 1) {
      orderUsersRequests.push(fetchUserByID(data.orders[i].user));
    }

    const orderUsers = await Promise.all(orderUsersRequests);

    for (let i = 0; i < orderUsersRequests.length; i += 1) {
      data.orders[i].userInfo = orderUsers[i];
    }

    if (!data) throw new Error('Empty response from server');
    if (data.error) throw new Error(data.error.message);
    dispatch({
      type: 'FETCH_ORDERS',
      orders: data.orders,
    });
  } catch (error) {
    notify('Unable to get all orders', error.message);
  }
};

export const editCollection: ThunkActionCreator = (newData) => async (dispatch) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${Config.API_URL + Config.routes.store.collection}/${newData.uuid}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Storage.get('token')}`,
        },
        body: JSON.stringify({ collection: newData.data }),
      });

      const { status } = response;
      if (status === 401 || status === 403) {
        dispatch(logoutUser()); // TODO
      }

      const data = await response.json();

      if (!data) throw new Error('Empty response from server');
      if (data.error) throw new Error(data.error.message);

      notify('Collection changes successfully saved!', data.collection.title);
      resolve(data);
    } catch (error) {
      notify('Some or all collection changes could not be saved!', error.message);
      reject(error);
    }
  });
};
