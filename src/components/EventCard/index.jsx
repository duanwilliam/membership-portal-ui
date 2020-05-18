import { Icon } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { isURL, getAbsoluteURL } from '../../utils';

import './styles.less';

const EventCard = (props) => {
  const {
    auth,
    cover,
    date,
    description,
    location,
    points,
    title,
    uuid,
  } = props;
  const history = useHistory();

  return (
    <div className="event-card">
      <img className="image" src={cover} alt={title} />
      <div className="info">
        <h2 className="title">{title}</h2>
        <p className="date">{date}</p>
        {isURL(location) ? (
          <a className="link" href={getAbsoluteURL(location)}>
            <p className="location">{location}</p>
          </a>
        ) : (
          <p className="location">{location}</p>
        )}
      </div>
      <div className="circle">
        <div className="inner" />
        <h2 className="points">{points}</h2>
      </div>
      {auth.admin && (
        <div className="edit-icon-wrapper">
          <Icon
            type="edit"
            className="edit-icon"
            onClick={() => {
              history.push(`/admin/editEvent/${uuid}`);
            }}
          />
        </div>
      )}
      <hr className="divider" />
      <p className="description">{description}</p>
    </div>
  );
};

EventCard.propTypes = {
  auth: PropTypes.shape({
    admin: PropTypes.bool.isRequired,
  }).isRequired,
  cover: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  points: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired,
};

export default EventCard;
