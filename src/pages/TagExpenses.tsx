// src/pages/Home.tsx
import { FC, ReactElement, useState } from "react";

import Button from "@mui/material/Button/Button";
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { useSelector } from "react-redux";
import { Col, Row } from "reactstrap";
import { ExpenseAPI } from "../api/ExpenseAPI";
import { hideTagExpense, selectExpense, setTagMap } from "../store/expenseActions";
import { getCurrentDate, getDateMonthTime, JSONCopy } from "../utility/utility";


const PaperStyled = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
  // lineHeight: '40px',
}));


const ButtonStyled = styled(Button)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  height: 50,
  fontSize: 12
}));



const tag_list = ['food', 'groceries', 'Amenities', 'veg & fruits', 'snacks',
  'shopping', 'rent', 'extra', 'ironing', 'petrol', 'transport', 'bike', 'parents',
  'parents-amazon', 'Skin & Hair', 'emi', 'medical', 'clothes', 'noodles', 'fitness', 'alcohol']



const TagExpenses: FC<any> = (): ReactElement => {

  const [selectedTag, setSelectedTag] = useState<string[]>([]);

  const [autoTag, setAutoTag] = useState<boolean>(false);

  const { tagList, expense, isTagModal } = useSelector(selectExpense);



  if (expense == null || !isTagModal) {
    return <></>;
  }


  const onSaveExpense = () => {

    console.log('onSaveExpense ');
    console.log('autoTag ', autoTag);

    let _vendor = expense.vendor;
    let _tag = expense.tag;

    if (autoTag) {

      let tagObj = tagList.find(({ vendor, tag }) => vendor === _vendor && tag === _tag);

      console.log('tagObj ', tagObj);

      if (!tagObj) {
        let key = _vendor;
        tagObj = {
          vendor: _vendor,
          tag: selectedTag[0],
          date: getCurrentDate()
        }
        ExpenseAPI.setOneDoc(key, tagObj, 'tagMap');
        setTagMap(tagObj);
      }

    }

    console.log('Saving expense ', expense);

    const expenseNew = JSONCopy(expense);

    expenseNew.tag = selectedTag[0];
    console.log('Saving expense new', JSONCopy(expenseNew));
    ExpenseAPI.addExpense(expenseNew);


  }

  console.log("Expense object ", expense);
  console.log("Get Date ", getCurrentDate());


  return (
    <div style={{ zIndex: 100, paddingTop: 20, position: 'fixed' }}>

      <PaperStyled elevation={10} sx={{ marginTop: 6, paddingBottom: 5, margin: 2, height: 'auto' }}>

        <Row style={{ padding: 20 }}>

          <Col>
            <Row className="">
              <Col xs="auto" >
                <span className='font-600 font-15'>{expense.vendor}</span>
              </Col>
            </Row>

            <Row className="pt-2">
              <Col xs="auto">
                <span className='font-600 font-12'>{getDateMonthTime(expense.date)}</span>
              </Col>

              <Col>
                <span className={expense.tag ? 'tag-text-red' : 'tag-text-purple-light'}>
                  {expense.tag ? expense.tag : 'untagged'}
                </span>
              </Col>
              <Col className='d-flex justify-content-center mr-2'>
                <span>₹</span>
                <span>{expense.cost}</span>
              </Col>
            </Row>

          </Col>
        </Row>

        <div style={{ padding: 8 }}>
          <ButtonStyled
            style={{
              width: '110px',
              height: '35px',
            }}
            variant={autoTag ? "contained" : "outlined"}
            onClick={() => setAutoTag(!autoTag)}
          >
            Auto Tag
          </ButtonStyled>
        </div>


        <div className="container">
          <div className="row" >

            {
              tag_list.map((val, index) => (
                <div className="col" style={{ padding: 8 }} key={index} >
                  <ButtonStyled
                    style={{
                      width: '100px',
                      height: '40px',
                    }}
                    variant={selectedTag.includes(val) ? "contained" : "outlined"}
                    onClick={() =>
                      setSelectedTag([val])}
                  >
                    {val}
                  </ButtonStyled>
                </div>
              ))
            }
          </div>
          <Row>
            <Col>
              <Button
                style={{
                  width: '140px',
                  height: '40px',
                  marginTop: '30px',
                }}
                variant={"contained"}
                onClick={onSaveExpense}
              >
                Save
              </Button>
            </Col>

            <Col>
              <Button
                style={{
                  width: '140px',
                  height: '40px',
                  marginTop: '30px',
                }}
                variant={"outlined"}
                onClick={hideTagExpense}
              >
                Close
              </Button>
            </Col>

          </Row>
        </div>
      </PaperStyled>
    </div>
  );
};

export default TagExpenses;


