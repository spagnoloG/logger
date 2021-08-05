import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';

const SimpleAlert = (props) => {
    return (
    <Alert status={props.status}>
        <AlertIcon />
        <AlertTitle mr={2}>{props.messageTitle}</AlertTitle>
        <AlertDescription>{props.message}</AlertDescription>
      </Alert>
    )
};

export default SimpleAlert;